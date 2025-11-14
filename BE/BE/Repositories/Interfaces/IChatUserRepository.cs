using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IChatUserRepository : IBaseRepository<ChatUser>
    {
        Task<IEnumerable<object>> GetInvitesAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetChatsAsync(int userId, int? petId, CancellationToken ct = default);
        Task<ChatUser?> GetChatUserByPetsAsync(int fromPetId, int toPetId, CancellationToken ct = default);
        Task<ChatUser?> GetChatUserByMatchIdAsync(int matchId, CancellationToken ct = default);
    }
}




