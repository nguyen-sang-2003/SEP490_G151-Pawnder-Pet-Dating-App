using BE.Models;
using BE.Services.Interfaces;
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
            var chat = await _geminiService.CreateChatSessionAsync(userId, title);

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
            chat.UpdatedAt = DateTime.Now;
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
            chat.UpdatedAt = DateTime.Now;

            _context.ChatAis.Update(chat);
            await _context.SaveChangesAsync(ct);

            return true;
        }

        public async Task<object> GetChatHistoryAsync(int chatAiId, int userId, CancellationToken ct = default)
        {
            var chat = await _context.ChatAis
                .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && c.UserId == userId && c.IsDeleted == false, ct);

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

            // Business logic: Check daily limit
            bool canAsk = await _dailyLimitService.CanPerformAction(userId, "ai_chat_question");
            if (!canAsk)
            {
                int remaining = await _dailyLimitService.GetRemainingCount(userId, "ai_chat_question");
                throw new InvalidOperationException($"Bạn đã hết lượt hỏi AI hôm nay! Nâng cấp lên VIP để sử dụng không giới hạn. Còn lại: {remaining}");
            }

            var answer = await _geminiService.SendMessageAsync(userId, chatAiId, question);

            // Business logic: Record action to daily limit
            await _dailyLimitService.RecordAction(userId, "ai_chat_question");
            int remainingQuestions = await _dailyLimitService.GetRemainingCount(userId, "ai_chat_question");

            return new
            {
                question = question,
                answer = answer,
                timestamp = DateTime.Now,
                remainingQuestions = remainingQuestions
            };
        }
    }
}

