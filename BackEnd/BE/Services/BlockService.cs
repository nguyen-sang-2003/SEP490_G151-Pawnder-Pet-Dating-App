using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class BlockService : IBlockService
    {
        private readonly IBlockRepository _blockRepository;
        private readonly PawnderDatabaseContext _context;

        public BlockService(IBlockRepository blockRepository, PawnderDatabaseContext context)
        {
            _blockRepository = blockRepository;
            _context = context;
        }

        public async Task<IEnumerable<object>> GetBlockedUsersAsync(int fromUserId, CancellationToken ct = default)
        {
            return await _blockRepository.GetBlockedUsersAsync(fromUserId, ct);
        }

        public async Task<object> CreateBlockAsync(int fromUserId, int toUserId, CancellationToken ct = default)
        {
            // Business logic: Validate
            if (fromUserId == toUserId)
                throw new InvalidOperationException("Người dùng không thể tự chặn chính mình.");

            var fromUserExists = await _context.Users.AnyAsync(u => u.UserId == fromUserId, ct);
            var toUserExists = await _context.Users.AnyAsync(u => u.UserId == toUserId, ct);

            if (!fromUserExists || !toUserExists)
                throw new KeyNotFoundException("Người dùng không tồn tại.");

            // Business logic: Check if already blocked
            var existingBlock = await _blockRepository.GetBlockAsync(fromUserId, toUserId, ct);
            if (existingBlock != null)
                throw new InvalidOperationException("Người dùng này đã bị chặn trước đó.");

            // Business logic: Soft delete existing chat/match if exists
            var existingChat = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .FirstOrDefaultAsync(c =>
                    c.IsDeleted == false &&
                    c.FromPet != null && c.ToPet != null &&
                    ((c.FromPet.UserId == fromUserId && c.ToPet.UserId == toUserId) ||
                    (c.FromPet.UserId == toUserId && c.ToPet.UserId == fromUserId)), ct);

            if (existingChat != null)
            {
                existingChat.IsDeleted = true;
                existingChat.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
                _context.Entry(existingChat).State = EntityState.Modified;
            }

            // Business logic: Auto-cancel pending/confirmed appointments between blocked users
            var appointmentsToCancel = await _context.Set<PetAppointment>()
                .Where(a => 
                    (a.Status == "pending" || a.Status == "confirmed") &&
                    ((a.InviterUserId == fromUserId && a.InviteeUserId == toUserId) ||
                     (a.InviterUserId == toUserId && a.InviteeUserId == fromUserId)))
                .ToListAsync(ct);

            foreach (var appointment in appointmentsToCancel)
            {
                appointment.Status = "cancelled";
                appointment.CancelledBy = fromUserId;
                appointment.CancelReason = "Tự động hủy do người dùng bị chặn";
                appointment.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            }

            // Business logic: Create block
            var block = new Block
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };

            await _blockRepository.AddAsync(block, ct);
            await _context.SaveChangesAsync(ct);

            return new
            {
                block.FromUserId,
                block.ToUserId,
                block.CreatedAt,
                Message = "Chặn người dùng thành công."
            };
        }

        public async Task<bool> DeleteBlockAsync(int fromUserId, int toUserId, CancellationToken ct = default)
        {
            var block = await _blockRepository.GetBlockAsync(fromUserId, toUserId, ct);
            if (block == null)
                return false;

            await _blockRepository.DeleteAsync(block, ct);
            return true;
        }
    }
}




