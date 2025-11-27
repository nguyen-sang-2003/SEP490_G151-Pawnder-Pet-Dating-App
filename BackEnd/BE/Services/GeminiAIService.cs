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
            
            // Validate API key
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                Console.WriteLine("❌ GEMINI API KEY IS NULL OR EMPTY!");
                Console.WriteLine($"   Checking configuration sections:");
                Console.WriteLine($"   - GeminiAI:ApiKey = {apiKey ?? "NULL"}");
                throw new InvalidOperationException("Gemini API Key is not configured in appsettings.json");
            }
            
            Console.WriteLine($"✅ Gemini API Key loaded: {apiKey.Substring(0, Math.Min(10, apiKey.Length))}... (length: {apiKey.Length})");
            
            try
            {
                // Note: Gemini API có thể bị giới hạn theo region
                // Nếu deploy trên Azure East Asia, có thể gặp lỗi "User location is not supported"
                _googleAI = new GoogleAI(apiKey: apiKey);
                Console.WriteLine("✅ GoogleAI client initialized successfully");
                Console.WriteLine("⚠️ Note: Gemini API may not work from certain regions (e.g., Asia). Consider using Vertex AI or allowed regions.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to initialize GoogleAI client: {ex.Message}");
                throw;
            }
        }

        // System Prompt tối ưu cho tốc độ (rút gọn từ 400+ từ → 100 từ)
        private string GetCatCareSystemPrompt()
        {
            return @"Bạn là Pawnder AI - trợ lý chăm sóc mèo chuyên nghiệp.

NHIỆM VỤ:
- Tư vấn sức khỏe, dinh dưỡng, hành vi, vệ sinh mèo
- Trả lời ngắn gọn (80-150 từ), tiếng Việt, giọng thân thiện
- Dùng bullet points khi liệt kê
- Vấn đề nghiêm trọng (nôn mửa, tiêu chảy kéo dài, khó thở, co giật) → đề nghị đến bác sĩ thú y ngay

CHỦ ĐỀ: Hành vi, dinh dưỡng, sức khỏe, vệ sinh, vui chơi, môi trường sống mèo.";
        }

        public async Task<ChatAi> CreateChatSessionAsync(int userId, string title)
        {
            var chatAi = new ChatAi
            {
                UserId = userId,
                Title = title ?? "Chat với AI",
                IsDeleted = false,
                CreatedAt = DateTime.Now, // Giữ nguyên DateTime.Now
                UpdatedAt = DateTime.Now  // Giữ nguyên DateTime.Now
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

            // Gọi Gemini API với model name (gemini-1.5-flash nhanh hơn 3x so với 2.5)
            string modelName = "gemini-1.5-flash"; // Stable & Fast model
            Console.WriteLine($"🤖 [Chat {chatAiId}] Using Gemini model: {modelName}");
            
            GenerativeModel model;
            try
            {
                model = _googleAI.GenerativeModel(model: modelName);
                Console.WriteLine($"✅ [Chat {chatAiId}] Model initialized successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [Chat {chatAiId}] Failed to initialize model '{modelName}': {ex.Message}");
                throw new Exception($"Không thể khởi tạo AI model: {ex.Message}");
            }
            
            // Xây dựng prompt
            var promptBuilder = new System.Text.StringBuilder();

            // System Prompt về mèo
            promptBuilder.AppendLine(GetCatCareSystemPrompt());
            promptBuilder.AppendLine("\n---\n");

            // Thêm lịch sử (CHỈ 1 cặp Q&A gần nhất để tối ưu tốc độ)
            // Lý do: History càng dài → tokens càng nhiều → Gemini càng chậm
            // 1 cặp đủ để duy trì context mà vẫn nhanh
            var recentHistory = history
                .Where(h => !string.IsNullOrEmpty(h.Question) && !string.IsNullOrEmpty(h.Answer))
                .TakeLast(1)
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

            // Gọi Gemini với timeout 30 giây (đủ cho model nhanh)
            string answer;
            int inputTokens = 0;
            int outputTokens = 0;
            int totalTokens = 0;
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                Console.WriteLine($"🤖 [Chat {chatAiId}] Calling Gemini API... (history: {recentHistory.Count} pairs, question length: {question.Length})");
                var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                var response = await model.GenerateContent(promptBuilder.ToString(), cancellationToken: cts.Token);
                answer = response.Text ?? throw new Exception("Gemini API returned null response");
                
                // Lấy thông tin token usage từ response
                if (response.UsageMetadata != null)
                {
                    inputTokens = response.UsageMetadata.PromptTokenCount;
                    outputTokens = response.UsageMetadata.CandidatesTokenCount;
                    totalTokens = response.UsageMetadata.TotalTokenCount;
                }
                
                stopwatch.Stop();
                Console.WriteLine($"✅ [Chat {chatAiId}] Gemini responded in {stopwatch.ElapsedMilliseconds}ms | Tokens: {inputTokens} in + {outputTokens} out = {totalTokens} total");
            }
            catch (OperationCanceledException)
            {
                stopwatch.Stop();
                Console.WriteLine($"⏱️ [Chat {chatAiId}] Gemini timeout after 30s (history: {recentHistory.Count} pairs)");
                throw new Exception("AI đang quá tải, mất quá nhiều thời gian để trả lời. Vui lòng thử lại sau hoặc đặt câu hỏi ngắn gọn hơn.");
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"❌ [Chat {chatAiId}] Gemini error after {stopwatch.ElapsedMilliseconds}ms");
                Console.WriteLine($"   Exception Type: {ex.GetType().FullName}");
                Console.WriteLine($"   Message: {ex.Message}");
                
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"   InnerException Type: {ex.InnerException.GetType().FullName}");
                    Console.WriteLine($"   InnerException Message: {ex.InnerException.Message}");
                }
                
                Console.WriteLine($"   StackTrace: {ex.StackTrace}");
                
                // Return more specific error messages
                if (ex.Message.Contains("API key"))
                {
                    throw new Exception("Gemini API key không hợp lệ. Vui lòng kiểm tra cấu hình.");
                }
                else if (ex.Message.Contains("location") || ex.Message.Contains("FAILED_PRECONDITION") || ex.Message.Contains("not supported"))
                {
                    throw new Exception("⚠️ Gemini API không khả dụng từ khu vực này (Azure East Asia). Vui lòng:\n" +
                        "1. Tạo API key mới từ region được hỗ trợ (US, EU)\n" +
                        "2. Hoặc deploy backend ở region khác (US East, West Europe)\n" +
                        "3. Hoặc sử dụng Vertex AI thay thế");
                }
                else if (ex.Message.Contains("429") || ex.Message.Contains("quota"))
                {
                    throw new Exception("AI đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.");
                }
                else if (ex.Message.Contains("404") || ex.Message.Contains("not found"))
                {
                    throw new Exception("Không tìm thấy AI model. Vui lòng liên hệ quản trị viên.");
                }
                else
                {
                    throw new Exception($"Lỗi kết nối AI: {ex.Message}");
                }
            }

            // Lưu Q&A
            var content = new ChatAicontent
            {
                ChatAiid = chatAiId,
                Question = question,
                Answer = answer,
                CreatedAt = DateTime.Now, // <-- ĐÃ ĐỔI
                UpdatedAt = DateTime.Now  // <-- ĐÃ ĐỔI
            };
            _context.ChatAicontents.Add(content);

            // Cập nhật chat
            chatAi.UpdatedAt = DateTime.Now; // <-- ĐÃ ĐỔI

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