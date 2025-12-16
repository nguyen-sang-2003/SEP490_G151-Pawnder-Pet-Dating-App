using BE.Models;
using BE.Services.Interfaces;
using BE.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ChatAIService : IChatAIService
    {
        private readonly IGeminiAIService _geminiService;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;

        public ChatAIService(
            IGeminiAIService geminiService,
            PawnderDatabaseContext context,
            DailyLimitService dailyLimitService)
        {
            _geminiService = geminiService;
            _context = context;
            _dailyLimitService = dailyLimitService;
        }

        public async Task<IEnumerable<object>> GetAllChatsAsync(int userId, CancellationToken ct = default)
        {
            var chats = await _context.ChatAis
                .Where(c => c.UserId == userId && c.IsDeleted == false)
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new
                {
                    c.ChatAiid,
                    c.Title,
                    c.CreatedAt,
                    c.UpdatedAt,
                    MessageCount = c.ChatAicontents.Count(),
                    LastQuestion = c.ChatAicontents
                        .OrderByDescending(m => m.CreatedAt)
                        .Select(m => m.Question)
                        .FirstOrDefault()
                })
                .ToListAsync(ct);

            return chats;
        }

        public async Task<object> CreateChatAsync(int userId, string? title, CancellationToken ct = default)
        {
            var chat = await _geminiService.CreateChatSessionAsync(userId, title ?? "New Chat");

            return new
            {
                chatId = chat.ChatAiid,
                title = chat.Title,
                createdAt = chat.CreatedAt
            };
        }

        public async Task<bool> UpdateChatTitleAsync(int chatAiId, int userId, string title, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Tiêu đề không được để trống");

            var chat = await _context.ChatAis
                .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && c.UserId == userId && c.IsDeleted == false, ct);

            if (chat == null)
                throw new KeyNotFoundException("Không tìm thấy cuộc trò chuyện");

            chat.Title = title;
            chat.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            await _context.SaveChangesAsync(ct);

            return true;
        }

        public async Task<bool> DeleteChatAsync(int chatAiId, int userId, CancellationToken ct = default)
        {
            var chat = await _context.ChatAis
                .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && (userId == 0 || c.UserId == userId), ct);

            if (chat == null)
                throw new KeyNotFoundException("Không tìm thấy cuộc trò chuyện");

            chat.IsDeleted = true;
            chat.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            _context.ChatAis.Update(chat);
            await _context.SaveChangesAsync(ct);

            return true;
        }

        public async Task<object> GetChatHistoryAsync(int chatAiId, int userId, CancellationToken ct = default)
        {
            // Allow experts/admins to view any chat (userId = 0), or users to view their own chats
            var chat = await _context.ChatAis
                .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && (userId == 0 || c.UserId == userId) && c.IsDeleted == false, ct);

            if (chat == null)
                throw new KeyNotFoundException("Không tìm thấy cuộc trò chuyện");

            var messages = await _geminiService.GetChatHistoryAsync(chatAiId);

            return new
            {
                chatTitle = chat.Title,
                messages = messages.Select(m => new
                {
                    contentId = m.ContentId,
                    question = m.Question,
                    answer = m.Answer,
                    createdAt = m.CreatedAt
                })
            };
        }

        public async Task<object> SendMessageAsync(int chatAiId, int userId, string question, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(question))
                throw new ArgumentException("Câu hỏi không được để trống");

            // Kiểm tra user
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng");

            // Kiểm tra VIP
            bool isVip = user.UserStatusId == 3;

            // 🎯 LOGIC FREEMIUM:
            // 1. Free users → 10,000 tokens/ngày (~10-15 câu hỏi)
            // 2. VIP users → 50,000 tokens/ngày (5x nhiều hơn)
            // 3. Hết quota → Upsell nâng cấp VIP

            const int FREE_TOKENS_PER_DAY = 10000;
            const int VIP_TOKENS_PER_DAY = 50000;

            try
            {
                // 1. Ước lượng tokens trước khi gọi API
                int estimatedTokens = EstimateTokens(question);

                // 2. Lấy tokens đã dùng hôm nay
                int tokensUsedToday = await _dailyLimitService.GetFreeTokensUsedToday(userId);
                int dailyQuota = isVip ? VIP_TOKENS_PER_DAY : FREE_TOKENS_PER_DAY;
                int tokensRemaining = Math.Max(0, dailyQuota - tokensUsedToday);

                // 3. Check quota TRƯỚC KHI gọi API
                if (tokensRemaining < estimatedTokens)
                {
                    // Không đủ tokens - throw custom exception với usage info
                    string errorMessage;
                    if (isVip)
                    {
                        errorMessage = $"⭐ VIP: Bạn đã dùng hết lượt chat ngày hôm nay!\n" +
                            $"Vui lòng chờ reset vào 00:00 ngày mai.";
                    }
                    else
                    {
                        errorMessage = $"🎁 Bạn đã dùng lượt chat miễn phí hôm nay!\n" +
                            $"⭐ Nâng cấp VIP - 99,000đ/tháng:\n" +
                            $"• 25x nhiều hơn\n" +
                            $"• Trả lời nhanh hơn\n" +
                            $"• Hỗ trợ ưu tiên\n" ;
                            
                    }
                    
                    throw new QuotaExceededException(
                        errorMessage,
                        isVip,
                        dailyQuota,
                        tokensUsedToday,  // Số tokens thực tế đã dùng
                        tokensRemaining   // Số tokens còn lại (có thể > 0 nhưng không đủ cho câu hỏi này)
                    );
                }

                // 4. Mới gọi API thật (đã kiểm tra quota)
                var geminiResponse = await _geminiService.SendMessageAsync(userId, chatAiId, question);
                int actualTokensUsed = geminiResponse.TotalTokens;

                // 5. Trừ tokens thực tế
                await _dailyLimitService.RecordTokenUsage(userId, actualTokensUsed);

                // 6. Cập nhật số liệu cuối cùng
                tokensUsedToday += actualTokensUsed;
                tokensRemaining = Math.Max(0, dailyQuota - tokensUsedToday);

                // 7. Check nếu vượt quota sau khi trả lời (để hiện warning)
                bool exceededQuota = tokensUsedToday >= dailyQuota;

                return new
                {
                    question = question,
                    answer = geminiResponse.Answer,
                    timestamp = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified),
                    usage = new
                    {
                        isVip = isVip,
                        dailyQuota = dailyQuota,
                        tokensUsed = tokensUsedToday,  // Tổng tokens đã dùng trong ngày
                        tokensRemaining = tokensRemaining,
                        exceededQuota = exceededQuota  // Flag để FE biết cần hiện modal
                    },
                    tokenDetails = new
                    {
                        inputTokens = geminiResponse.InputTokens,
                        outputTokens = geminiResponse.OutputTokens,
                        totalTokens = geminiResponse.TotalTokens
                    }
                };
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<object> GetTokenUsageAsync(int userId, CancellationToken ct = default)
        {
            // Kiểm tra user
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng");

            // Kiểm tra VIP
            bool isVip = user.UserStatusId == 3;

            const int FREE_TOKENS_PER_DAY = 10000;
            const int VIP_TOKENS_PER_DAY = 50000;

            // Lấy tokens đã dùng hôm nay
            int tokensUsedToday = await _dailyLimitService.GetFreeTokensUsedToday(userId);
            int dailyQuota = isVip ? VIP_TOKENS_PER_DAY : FREE_TOKENS_PER_DAY;
            int tokensRemaining = Math.Max(0, dailyQuota - tokensUsedToday);

            return new
            {
                isVip = isVip,
                dailyQuota = dailyQuota,
                tokensUsed = tokensUsedToday,
                tokensRemaining = tokensRemaining
            };
        }

        // Hàm ước lượng tokens dựa trên độ dài text
        private int EstimateTokens(string text)
        {
            // Công thức ước lượng:
            // - Tiếng Việt: ~1.5 ký tự = 1 token
            // - Tiếng Anh: ~4 ký tự = 1 token
            // - Response thường dài gấp 2-3x input

            int inputTokens = (int)Math.Ceiling(text.Length / 2.0); // Conservative estimate
            int estimatedOutputTokens = inputTokens * 3; // Response thường dài hơn

            return inputTokens + estimatedOutputTokens;
        }

        public async Task<object> CloneChatForExpertAsync(int originalChatAiId, int expertId, CancellationToken ct = default)
        {
            // 1. Load original chat
            var originalChat = await _context.ChatAis
                .Include(c => c.ChatAicontents)
                .FirstOrDefaultAsync(c => c.ChatAiid == originalChatAiId && c.IsDeleted == false, ct);

            if (originalChat == null)
                throw new KeyNotFoundException("Không tìm thấy cuộc trò chuyện gốc");

            // 2. Check if expert exists
            var expert = await _context.Users.FindAsync(expertId);
            if (expert == null)
                throw new KeyNotFoundException("Không tìm thấy chuyên gia");

            // 3. Create new chat for expert
            var newChat = new ChatAi
            {
                UserId = expertId,
                Title = $"[Tư vấn Expert] {originalChat.Title}",
                IsDeleted = false,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };

            _context.ChatAis.Add(newChat);
            await _context.SaveChangesAsync(ct);

            // 4. Copy all messages from original chat
            var originalMessages = originalChat.ChatAicontents.OrderBy(m => m.CreatedAt).ToList();
            foreach (var msg in originalMessages)
            {
                var newMessage = new ChatAicontent
                {
                    ChatAiid = newChat.ChatAiid,
                    Question = msg.Question,
                    Answer = msg.Answer,
                    CreatedAt = msg.CreatedAt,
                    UpdatedAt = msg.UpdatedAt
                };
                _context.ChatAicontents.Add(newMessage);
            }

            await _context.SaveChangesAsync(ct);

            return new
            {
                chatId = newChat.ChatAiid,
                title = newChat.Title,
                createdAt = newChat.CreatedAt,
                messageCount = originalMessages.Count,
                clonedFromChatAiId = originalChatAiId
            };
        }
    }
}

