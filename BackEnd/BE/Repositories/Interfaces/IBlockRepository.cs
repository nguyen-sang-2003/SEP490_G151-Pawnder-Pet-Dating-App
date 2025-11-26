using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IBlockRepository : IBaseRepository<Block>
    {
        Task<IEnumerable<object>> GetBlockedUsersAsync(int fromUserId, CancellationToken ct = default);
        Task<Block?> GetBlockAsync(int fromUserId, int toUserId, CancellationToken ct = default);
        Task<bool> BlockExistsAsync(int fromUserId, int toUserId, CancellationToken ct = default);
    }
}




