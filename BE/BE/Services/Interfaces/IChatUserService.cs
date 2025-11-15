namespace BE.Services.Interfaces
{
    public interface IChatUserService
    {
        Task<IEnumerable<object>> GetInvitesAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetChatsAsync(int userId, int? petId, CancellationToken ct = default);
        Task<object> CreateFriendRequestAsync(int fromPetId, int toPetId, CancellationToken ct = default);
        Task<object> UpdateFriendRequestAsync(int matchId, CancellationToken ct = default);
        Task<bool> DeleteFriendRequestAsync(int matchId, CancellationToken ct = default);
        Task<bool> DeleteChatAsync(int matchId, CancellationToken ct = default);
    }
}




