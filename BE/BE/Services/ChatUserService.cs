using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ChatUserService : IChatUserService
    {
        private readonly IChatUserRepository _chatUserRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _limitService;

        public ChatUserService(
            IChatUserRepository chatUserRepository,
            PawnderDatabaseContext context,
            DailyLimitService limitService)
        {
            _chatUserRepository = chatUserRepository;
            _context = context;
            _limitService = limitService;
        }

        public async Task<IEnumerable<object>> GetInvitesAsync(int userId, CancellationToken ct = default)
        {
            return await _chatUserRepository.GetInvitesAsync(userId, ct);
        }

        public async Task<IEnumerable<object>> GetChatsAsync(int userId, int? petId, CancellationToken ct = default)
        {
            return await _chatUserRepository.GetChatsAsync(userId, petId, ct);
        }

        public async Task<object> CreateFriendRequestAsync(int fromPetId, int toPetId, CancellationToken ct = default)
        {
            if (fromPetId == toPetId)
                throw new InvalidOperationException("Không thể gửi yêu cầu cho chính mình.");

            // Business logic: Get user from pet to check limit
            var fromPet = await _context.Pets
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.PetId == fromPetId, ct);

            if (fromPet == null || fromPet.User == null)
                throw new KeyNotFoundException("Không tìm thấy pet hoặc user của pet.");

            int fromUserId = fromPet.User.UserId;

            // Business logic: Check daily limit
            bool canPerform = await _limitService.CanPerformAction(fromUserId, "request_match");
            if (!canPerform)
            {
                int remaining = await _limitService.GetRemainingCount(fromUserId, "request_match");
                throw new InvalidOperationException($"Đã vượt quá giới hạn gửi lời mời kết bạn trong ngày. Còn lại: {remaining}");
            }

            // Business logic: Check if already sent
            var existing1 = await _chatUserRepository.GetChatUserByPetsAsync(fromPetId, toPetId, ct);
            if (existing1 != null)
                throw new InvalidOperationException("Yêu cầu này đã tồn tại.");

            // Business logic: Check if already received (mutual like)
            var existing2 = await _context.ChatUsers
                .FirstOrDefaultAsync(c =>
                    c.FromPetId == toPetId && c.ToPetId == fromPetId && c.IsDeleted == false, ct);
            if (existing2 != null)
            {
                existing2.Status = "Accepted";
                await _chatUserRepository.UpdateAsync(existing2, ct);

                // Business logic: Record action
                await _limitService.RecordAction(fromUserId, "request_match");

                return new
                {
                    existing2.MatchId,
                    existing2.FromPetId,
                    existing2.ToPetId,
                    existing2.Status
                };
            }

            // Business logic: Create new friend request
            var chatUser = new ChatUser
            {
                FromPetId = fromPetId,
                ToPetId = toPetId,
                Status = "Pending",
                IsDeleted = false,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };

            await _chatUserRepository.AddAsync(chatUser, ct);

            // Business logic: Record action
            bool recorded = await _limitService.RecordAction(fromUserId, "request_match");

            return new
            {
                chatUser.MatchId,
                chatUser.FromPetId,
                chatUser.ToPetId,
                chatUser.Status,
                chatUser.CreatedAt
            };
        }

        public async Task<object> UpdateFriendRequestAsync(int matchId, CancellationToken ct = default)
        {
            var chatUser = await _chatUserRepository.GetChatUserByMatchIdAsync(matchId, ct);
            if (chatUser == null)
                throw new KeyNotFoundException("Không tìm thấy yêu cầu kết bạn.");

            // Business logic: Accept friend request
            chatUser.Status = "Accepted";
            chatUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            await _chatUserRepository.UpdateAsync(chatUser, ct);

            return new
            {
                chatUser.MatchId,
                chatUser.FromPetId,
                chatUser.ToPetId,
                chatUser.Status,
                chatUser.UpdatedAt
            };
        }

        public async Task<bool> DeleteFriendRequestAsync(int matchId, CancellationToken ct = default)
        {
            var chatUser = await _chatUserRepository.GetChatUserByMatchIdAsync(matchId, ct);
            if (chatUser == null)
                return false;

            await _chatUserRepository.DeleteAsync(chatUser, ct);
            return true;
        }

        public async Task<bool> DeleteChatAsync(int matchId, CancellationToken ct = default)
        {
            var chatUser = await _context.ChatUsers
                .FirstOrDefaultAsync(cu => cu.MatchId == matchId && cu.IsDeleted == false, ct);
            if (chatUser == null)
                return false;

            // Business logic: Soft delete
            chatUser.IsDeleted = true;
            chatUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            await _chatUserRepository.UpdateAsync(chatUser, ct);
            return true;
        }
    }
}

