namespace BE.Services.Interfaces
{
    public interface IChatUserContentService
    {
        Task<IEnumerable<object>> GetChatMessagesAsync(int matchId, CancellationToken ct = default);
        Task<object> SendMessageAsync(int matchId, int fromUserId, string message, CancellationToken ct = default);
    }
}




