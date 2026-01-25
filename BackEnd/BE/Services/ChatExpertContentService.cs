using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ChatExpertContentService : IChatExpertContentService
    {
        private readonly IChatExpertContentRepository _contentRepository;
        private readonly IChatExpertRepository _chatExpertRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IDailyLimitService _dailyLimitService;
        private readonly IBadWordService _badWordService;

        public ChatExpertContentService(
            IChatExpertContentRepository contentRepository,
            IChatExpertRepository chatExpertRepository,
            PawnderDatabaseContext context,
            IHubContext<ChatHub> hubContext,
            IDailyLimitService dailyLimitService,
            IBadWordService badWordService)
        {
            _contentRepository = contentRepository;
            _chatExpertRepository = chatExpertRepository;
            _context = context;
            _hubContext = hubContext;
            _dailyLimitService = dailyLimitService;
            _badWordService = badWordService;
        }

        public async Task<IEnumerable<object>> GetChatMessagesAsync(int chatExpertId, CancellationToken ct = default)
        {
            var exists = await _contentRepository.ChatExpertExistsAsync(chatExpertId, ct);
            if (!exists)
                throw new KeyNotFoundException("Không tìm thấy đoạn chat.");

            var messages = await _contentRepository.GetChatMessagesAsync(chatExpertId, ct);
            return messages;
        }

        public async Task<object> SendMessageAsync(int chatExpertId, int fromId, string message, int? expertId, int? userId, int? chatAiid, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(message))
                throw new ArgumentException("Tin nhắn không được để trống.");

            // Business logic: Kiểm tra từ cấm
            var (isBlocked, filteredMessage, violationLevel) = await _badWordService.CheckAndFilterMessageAsync(message, ct);
            
            if (isBlocked)
            {
                throw new InvalidOperationException("Tin nhắn của bạn chứa nội dung không phù hợp và không thể gửi.");
            }

            // Sử dụng filteredMessage (đã che từ Level 1)
            message = filteredMessage;

            // Validate chat exists
            var chatExpert = await _context.ChatExperts
                .Include(c => c.Expert)
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.ChatExpertId == chatExpertId, ct);
            if (chatExpert == null)
                throw new KeyNotFoundException("Không tồn tại đoạn chat.");

            // Validate fromId belongs to this chat (either expert or user)
            if (chatExpert.ExpertId != fromId && chatExpert.UserId != fromId)
                throw new InvalidOperationException("Người dùng không thuộc cuộc chat này.");

            // Kiểm tra giới hạn chat với expert (chỉ áp dụng cho User gửi tin nhắn cho Expert)
            if (fromId == chatExpert.UserId)
            {
                bool canChat = await _dailyLimitService.CanPerformAction(fromId, "expert_chat");
                if (!canChat)
                {
                    int remaining = await _dailyLimitService.GetRemainingCount(fromId, "expert_chat");
                    throw new InvalidOperationException($"Bạn đã hết lượt chat với chuyên gia hôm nay!");
                }
            }

            // If ExpertConfirmation is provided, validate it exists
            if (expertId.HasValue && userId.HasValue && chatAiid.HasValue)
            {
                var confirmationExists = await _context.ExpertConfirmations
                    .AnyAsync(ec => ec.ExpertId == expertId.Value 
                        && ec.UserId == userId.Value 
                        && ec.ChatAiid == chatAiid.Value, ct);
                if (!confirmationExists)
                    throw new KeyNotFoundException("Không tìm thấy xác nhận chuyên gia.");
            }

            // Create message
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var chatMessage = new ChatExpertContent
            {
                ChatExpertId = chatExpertId,
                FromId = fromId,
                Message = message,
                ExpertId = expertId,
                UserId = userId,
                ChatAiid = chatAiid,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _contentRepository.AddAsync(chatMessage, ct);

            // Ghi nhận action nếu là User gửi tin nhắn cho Expert
            if (fromId == chatExpert.UserId)
            {
                await _dailyLimitService.RecordAction(fromId, "expert_chat");
            }

            // Determine recipient (the other person in the chat)
            int? toUserId = (fromId == chatExpert.ExpertId) ? chatExpert.UserId : chatExpert.ExpertId;

            // Send SignalR notification for real-time updates
            try
            {
                Console.WriteLine($"[ChatExpertContent] Sending SignalR message for chatExpertId={chatExpertId}, fromId={fromId}, toUserId={toUserId}");
                Console.WriteLine($"[ChatExpertContent] Chat info: ExpertId={chatExpert.ExpertId}, UserId={chatExpert.UserId}");
                
                await ChatHub.SendExpertMessage(_hubContext, chatExpertId, fromId, message, toUserId);
                Console.WriteLine($"[ChatExpertContent] SignalR message sent successfully");
                
                // Send badge notification to recipient (both user and expert)
                if (toUserId.HasValue)
                {
                    Console.WriteLine($"[ChatExpertContent] Sending badge notification to recipient {toUserId.Value}");
                    await ChatHub.SendNewExpertMessageBadge(_hubContext, toUserId.Value, chatExpertId);
                }
            }
            catch (Exception signalREx)
            {
                // Don't fail if SignalR fails (user might be offline)
                Console.WriteLine($"[ChatExpertContent] SignalR notification failed (user might be offline): {signalREx.Message}");
            }

            return new
            {
                message = chatMessage.Message, // Return the filtered message
                contentId = chatMessage.ContentId,
                chatExpertId = chatMessage.ChatExpertId,
                fromId = chatMessage.FromId,
                createdAt = chatMessage.CreatedAt
            };
        }
    }
}

