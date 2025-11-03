using BE.Models;

namespace BE.Services
{
    public interface IGeminiAIService
    {
        Task<string> SendMessageAsync(int userId, int chatAiId, string question);
        Task<ChatAi> CreateChatSessionAsync(int userId, string question);
        Task<List<ChatAicontent>> GetChatHistoryAsync(int chatAiId);
    }
}
