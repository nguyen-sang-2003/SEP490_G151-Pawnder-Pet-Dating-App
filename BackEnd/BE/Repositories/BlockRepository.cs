using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class BlockRepository : BaseRepository<Block>, IBlockRepository
    {
        public BlockRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<object>> GetBlockedUsersAsync(int fromUserId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(b => b.ToUser)
                .Where(b => b.FromUserId == fromUserId)
                .Select(b => new
                {
                    b.ToUserId,
                    ToUserFullName = b.ToUser != null ? b.ToUser.FullName : null,
                    ToUserEmail = b.ToUser != null ? b.ToUser.Email : null,
                    b.CreatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<Block?> GetBlockAsync(int fromUserId, int toUserId, CancellationToken ct = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(b => b.FromUserId == fromUserId && b.ToUserId == toUserId, ct);
        }

        public async Task<bool> BlockExistsAsync(int fromUserId, int toUserId, CancellationToken ct = default)
        {
            return await _dbSet
                .AnyAsync(b => b.FromUserId == fromUserId && b.ToUserId == toUserId, ct);
        }
    }
}




