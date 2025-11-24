using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ChatExpertContentService : IChatExpertContentService
    {
        private readonly IChatExpertContentRepository _contentRepository;
        private readonly IChatExpertRepository _chatExpertRepository;
        private readonly PawnderDatabaseContext _context;

        public ChatExpertContentService(
            IChatExpertContentRepository contentRepository,
            IChatExpertRepository chatExpertRepository,
            PawnderDatabaseContext context)
        {
            _contentRepository = contentRepository;
            _chatExpertRepository = chatExpertRepository;
            _context = context;
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

            return new
            {
                message = "Gửi tin nhắn thành công.",
                contentId = chatMessage.ContentId,
                chatExpertId = chatMessage.ChatExpertId,
                fromId = chatMessage.FromId,
                createdAt = chatMessage.CreatedAt
            };
        }
    }
}

