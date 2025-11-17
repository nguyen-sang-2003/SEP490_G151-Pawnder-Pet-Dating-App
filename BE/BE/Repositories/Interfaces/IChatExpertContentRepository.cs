using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IChatExpertContentRepository : IBaseRepository<ChatExpertContent>
    {
        Task<IEnumerable<object>> GetChatMessagesAsync(int chatExpertId, CancellationToken ct = default);
        Task<bool> ChatExpertExistsAsync(int chatExpertId, CancellationToken ct = default);
    }
}

