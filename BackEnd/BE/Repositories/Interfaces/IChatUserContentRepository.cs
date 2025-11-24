using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IChatUserContentRepository : IBaseRepository<ChatUserContent>
    {
        Task<IEnumerable<object>> GetChatMessagesAsync(int matchId, CancellationToken ct = default);
        Task<bool> ChatExistsAsync(int matchId, CancellationToken ct = default);
    }
}




