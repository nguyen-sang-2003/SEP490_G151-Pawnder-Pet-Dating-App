namespace BE.Services.Interfaces
{
    public interface IBlockService
    {
        Task<IEnumerable<object>> GetBlockedUsersAsync(int fromUserId, CancellationToken ct = default);
        Task<object> CreateBlockAsync(int fromUserId, int toUserId, CancellationToken ct = default);
        Task<bool> DeleteBlockAsync(int fromUserId, int toUserId, CancellationToken ct = default);
    }
}




