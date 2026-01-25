using Mscc.GenerativeAI;
using BE.Models;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class GeminiAIService : IGeminiAIService
    {
        private readonly PawnderDatabaseContext _context;
        private readonly IConfiguration _configuration;
        private readonly GoogleAI _googleAI;

        public GeminiAIService(PawnderDatabaseContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            var apiKey = _configuration["GeminiAI:ApiKey"];
            _googleAI = new GoogleAI(apiKey: apiKey);
        }

        // System Prompt cố định cho mèo
        private string GetCatCareSystemPrompt()
        {
            return @"Bạn là Pawnder AI - trợ lý AI chuyên về chăm sóc mèo của ứng dụng Pawnder.

VAI TRÒ CỦA BẠN:
- Chuyên gia tư vấn toàn diện về mèo: sức khỏe, dinh dưỡng, hành vi, huấn luyện, vệ sinh
- Giúp người nuôi mèo hiểu rõ hơn về thú cưng của mình
- Tạo môi trường thân thiện, dễ tiếp cận cho mọi câu hỏi về mèo

NGUYÊN TẮC TRẢ LỜI:
✓ Trả lời bằng tiếng Việt (trừ khi user hỏi bằng tiếng Anh)
✓ Giọng điệu thân thiện, dễ hiểu, không quá học thuật
✓ Độ dài: 80-150 từ , súc tích nhưng đầy đủ thông tin
✓ Dùng bullet points khi liệt kê các bước hoặc gợi ý
✓ Luôn tích cực và khích lệ người nuôi mèo
✓ Nếu không chắc chắn, thừa nhận và gợi ý tham khảo thêm
✓ KHÔNG sử dụng markdown formatting (**, ***, *, _, #, ```) - chỉ dùng text thuần túy và emoji

LƯU Ý QUAN TRỌNG VỀ SỨC KHỎE:
- Khi đề cập vấn đề sức khỏe nghiêm trọng (nôn mửa liên tục, tiêu chảy, không ăn uống >24h, khó thở, co giật), LUÔN đề nghị đưa mèo đến bác sĩ thú y ngay
- Không tự ý chẩn đoán bệnh - chỉ cung cấp thông tin tham khảo
- Có thể hướng dẫn sơ cứu cơ bản, nhưng nhấn mạnh cần đến bác sĩ

CÁC CHỦ ĐỀ BẠN GIỎI:
🐱 Hành vi mèo: kêu meo, cào, cắn, đánh dấu lãnh thổ, ngôn ngữ cơ thể
🍽️ Dinh dưỡng: thức ăn phù hợp, lượng ăn, cân nặng lý tưởng, nước uống
🏥 Sức khỏe: triệu chứng bệnh phổ biến, chăm sóc phòng bệnh, vaccine, tẩy giun
🚽 Vệ sinh: khay cát, tắm rửa, cắt móng, chải lông
🎮 Vui chơi: đồ chơi, kích thích trí tuệ, tương tác với mèo
🏠 Môi trường sống: chuồng, cây cào, không gian an toàn
👶 Nuôi mèo con: chăm sóc mèo nhỏ, xã hội hóa, huấn luyện cơ bản
👵 Mèo lớn tuổi: chăm sóc đặc biệt, vấn đề sức khỏe thường gặp

Bây giờ hãy sẵn sàng giúp đỡ những người yêu mèo!";
        }

        public async Task<ChatAi> CreateChatSessionAsync(int userId, string title)
        {
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var chatAi = new ChatAi
            {
                UserId = userId,
                Title = title ?? "Chat với AI",
                IsDeleted = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.ChatAis.Add(chatAi);
            await _context.SaveChangesAsync();

            return chatAi;
        }

        public async Task<GeminiResponse> SendMessageAsync(int userId, int chatAiId, string question)
        {
            // Kiểm tra chat session (chỉ cho phép truy cập chat của chính mình)
            var chatAi = await _context.ChatAis
                .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && c.UserId == userId && c.IsDeleted == false);

            if (chatAi == null)
            {
                throw new Exception("Chat session not found or access denied");
            }

            // Lấy lịch sử chat
            var history = await GetChatHistoryAsync(chatAiId);

            // Gọi Gemini API
            //var model = _googleAI.GenerativeModel(model: "gemini-2.0-flash-exp");
            var model = _googleAI.GenerativeModel(model: "gemini-2.5-flash");
            // Xây dựng prompt
            var promptBuilder = new System.Text.StringBuilder();

            // System Prompt về mèo
            promptBuilder.AppendLine(GetCatCareSystemPrompt());
            promptBuilder.AppendLine("\n---\n");

            // Thêm lịch sử (3 cặp Q&A gần nhất - giảm để Gemini xử lý nhanh hơn)
            // Lý do: History càng dài → tokens càng nhiều → Gemini càng chậm
            var recentHistory = history
                .Where(h => !string.IsNullOrEmpty(h.Question) && !string.IsNullOrEmpty(h.Answer))
                .TakeLast(5)
                .ToList();

            if (recentHistory.Any())
            {
                promptBuilder.AppendLine("Lịch sử hội thoại:");
                foreach (var msg in recentHistory)
                {
                    promptBuilder.AppendLine($"User: {msg.Question}");
                    promptBuilder.AppendLine($"Assistant: {msg.Answer}");
                }
                promptBuilder.AppendLine();
            }

            promptBuilder.AppendLine($"User: {question}");
            promptBuilder.AppendLine("Assistant:");

            // Gọi Gemini với timeout 60 giây (match với frontend timeout 50s + 10s buffer)
            string answer;
            int inputTokens = 0;
            int outputTokens = 0;
            int totalTokens = 0;
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                Console.WriteLine($"[Chat {chatAiId}] Calling Gemini API... (history: {recentHistory.Count} pairs, question length: {question.Length})");
                var cts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                var response = await model.GenerateContent(promptBuilder.ToString(), cancellationToken: cts.Token);
                answer = response.Text ?? throw new Exception("Gemini API returned null response");
                //
                // Lấy thông tin token usage từ response
                if (response.UsageMetadata != null)
                {
                    inputTokens = response.UsageMetadata.PromptTokenCount;
                    outputTokens = response.UsageMetadata.CandidatesTokenCount;
                    totalTokens = response.UsageMetadata.TotalTokenCount;
                }
                
                stopwatch.Stop();
                Console.WriteLine($"[Chat {chatAiId}] Gemini responded in {stopwatch.ElapsedMilliseconds}ms | Tokens: {inputTokens} in + {outputTokens} out = {totalTokens} total");
            }
            catch (OperationCanceledException)
            {
                stopwatch.Stop();
                Console.WriteLine($"[Chat {chatAiId}] Gemini timeout after 60s (history: {recentHistory.Count} pairs)");
                throw new Exception("AI đang quá tải, mất quá nhiều thời gian để trả lời. Vui lòng thử lại sau hoặc đặt câu hỏi ngắn gọn hơn.");
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"[Chat {chatAiId}] Gemini error after {stopwatch.ElapsedMilliseconds}ms: {ex.Message}");
                throw new Exception("Không thể kết nối với AI. Vui lòng thử lại sau.");
            }

            // Lưu Q&A
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var content = new ChatAicontent
            {
                ChatAiid = chatAiId,
                Question = question,
                Answer = answer,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.ChatAicontents.Add(content);

            // Cập nhật chat
            chatAi.UpdatedAt = now;

            // Auto-generate title nếu đây là câu hỏi đầu tiên
            if (history.Count == 0 && (chatAi.Title == "Chat với AI" || chatAi.Title == "New Chat"))
            {
                chatAi.Title = GenerateChatTitle(question);
            }

            await _context.SaveChangesAsync();

            return new GeminiResponse
            {
                Answer = answer,
                InputTokens = inputTokens,
                OutputTokens = outputTokens,
                TotalTokens = totalTokens
            };
        }

        public async Task<List<ChatAicontent>> GetChatHistoryAsync(int chatAiId)
        {
            return await _context.ChatAicontents
                .Where(c => c.ChatAiid == chatAiId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        // Tạo title tự động từ câu hỏi đầu tiên
        private string GenerateChatTitle(string firstQuestion)
        {
            // Lấy 50 ký tự đầu
            var title = firstQuestion.Length > 50
                ? firstQuestion.Substring(0, 47) + "..."
                : firstQuestion;

            return title;
        }
    }
}