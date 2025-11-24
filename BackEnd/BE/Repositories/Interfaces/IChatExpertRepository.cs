using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IChatExpertRepository : IBaseRepository<ChatExpert>
    {
        Task<IEnumerable<object>> GetChatsByUserIdAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetChatsByExpertIdAsync(int expertId, CancellationToken ct = default);
        Task<ChatExpert?> GetChatExpertByExpertAndUserAsync(int expertId, int userId, CancellationToken ct = default);
        Task<bool> ChatExpertExistsAsync(int chatExpertId, CancellationToken ct = default);
    }
}

