using BE.Models;

namespace BE.Services
{
    public interface IGeminiAIService
    {
        Task<GeminiResponse> SendMessageAsync(int userId, int chatAiId, string question);
        Task<ChatAi> CreateChatSessionAsync(int userId, string question);
        Task<List<ChatAicontent>> GetChatHistoryAsync(int chatAiId);
    }

    public class GeminiResponse
    {
        public string Answer { get; set; } = string.Empty;
        public int InputTokens { get; set; }  // Token của câu hỏi + lịch sử
        public int OutputTokens { get; set; }  // Token của câu trả lời
        public int TotalTokens { get; set; }  // Tổng token sử dụng
    }
}
