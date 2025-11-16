namespace BE.Services.Interfaces
{
    public interface IChatExpertContentService
    {
        Task<IEnumerable<object>> GetChatMessagesAsync(int chatExpertId, CancellationToken ct = default);
        Task<object> SendMessageAsync(int chatExpertId, int fromId, string message, int? expertId, int? userId, int? chatAiid, CancellationToken ct = default);
    }
}

