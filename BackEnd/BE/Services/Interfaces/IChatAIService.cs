namespace BE.Services.Interfaces
{
    public interface IChatAIService
    {
        Task<IEnumerable<object>> GetAllChatsAsync(int userId, CancellationToken ct = default);
        Task<object> CreateChatAsync(int userId, string? title, CancellationToken ct = default);
        Task<bool> UpdateChatTitleAsync(int chatAiId, int userId, string title, CancellationToken ct = default);
        Task<bool> DeleteChatAsync(int chatAiId, int userId, CancellationToken ct = default);
        Task<object> GetChatHistoryAsync(int chatAiId, int userId, CancellationToken ct = default);
        Task<object> SendMessageAsync(int chatAiId, int userId, string question, CancellationToken ct = default);
        Task<object> GetTokenUsageAsync(int userId, CancellationToken ct = default);
        Task<object> CloneChatForExpertAsync(int originalChatAiId, int expertId, CancellationToken ct = default);
    }
}




