using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ChatExpertService : IChatExpertService
    {
        private readonly IChatExpertRepository _chatExpertRepository;
        private readonly PawnderDatabaseContext _context;

        public ChatExpertService(
            IChatExpertRepository chatExpertRepository,
            PawnderDatabaseContext context)
        {
            _chatExpertRepository = chatExpertRepository;
            _context = context;
        }

        public async Task<IEnumerable<object>> GetChatsByUserIdAsync(int userId, CancellationToken ct = default)
        {
            // Validate user exists
            var userExists = await _context.Users.AnyAsync(u => u.UserId == userId, ct);
            if (!userExists)
                throw new KeyNotFoundException("Không tìm thấy người dùng.");

            return await _chatExpertRepository.GetChatsByUserIdAsync(userId, ct);
        }

        public async Task<IEnumerable<object>> GetChatsByExpertIdAsync(int expertId, CancellationToken ct = default)
        {
            // Validate expert exists
            var expertExists = await _context.Users.AnyAsync(u => u.UserId == expertId, ct);
            if (!expertExists)
                throw new KeyNotFoundException("Không tìm thấy chuyên gia.");

            return await _chatExpertRepository.GetChatsByExpertIdAsync(expertId, ct);
        }

        public async Task<object> CreateChatAsync(int expertId, int userId, CancellationToken ct = default)
        {
            if (expertId == userId)
                throw new InvalidOperationException("Không thể tạo chat với chính mình.");

            // Validate expert and user exist
            var expert = await _context.Users.FirstOrDefaultAsync(u => u.UserId == expertId, ct);
            if (expert == null)
                throw new KeyNotFoundException("Không tìm thấy chuyên gia.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng.");

            // Check if chat already exists
            var existingChat = await _chatExpertRepository.GetChatExpertByExpertAndUserAsync(expertId, userId, ct);
            if (existingChat != null)
            {
                return new
                {
                    existingChat.ChatExpertId,
                    existingChat.ExpertId,
                    existingChat.UserId,
                    existingChat.CreatedAt
                };
            }

            // Create new chat
            var chatExpert = new ChatExpert
            {
                ExpertId = expertId,
                UserId = userId,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };

            await _chatExpertRepository.AddAsync(chatExpert, ct);

            return new
            {
                chatExpert.ChatExpertId,
                chatExpert.ExpertId,
                chatExpert.UserId,
                chatExpert.CreatedAt
            };
        }
    }
}

