namespace BE.Services.Interfaces
{
    public interface IChatExpertService
    {
        Task<IEnumerable<object>> GetChatsByUserIdAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetChatsByExpertIdAsync(int expertId, CancellationToken ct = default);
        Task<object> CreateChatAsync(int expertId, int userId, CancellationToken ct = default);
    }
}

