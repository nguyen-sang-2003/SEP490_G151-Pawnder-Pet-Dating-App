using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BE.Services;
using BE.Models;
using System.Security.Claims;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/chat-ai")]
    [Authorize]
    public class ChatAIController : ControllerBase
    {
        private readonly IGeminiAIService _geminiService;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;

        public ChatAIController(
            IGeminiAIService geminiService, 
            PawnderDatabaseContext context,
            DailyLimitService dailyLimitService)
        {
            _geminiService = geminiService;
            _context = context;
            _dailyLimitService = dailyLimitService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                return int.Parse(userIdClaim);
            }
            return 0;
        }

        /// <summary>
        /// GET: /api/chat-ai/{userId} - Lấy tất cả cuộc trò chuyện của user
        /// </summary>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetAllChats(int userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                // Kiểm tra authentication
                if (currentUserId == 0)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }
                
                // Kiểm tra authorization - chỉ được xem chat của chính mình
                if (currentUserId != userId)
                {
                    return Forbid();
                }

                var chats = await _context.ChatAis
                    .Where(c => c.UserId == userId && c.IsDeleted == false)
                    .OrderByDescending(c => c.UpdatedAt)
                    .Select(c => new
                    {
                        c.ChatAiid,
                        c.Title,
                        c.CreatedAt,
                        c.UpdatedAt,
                        MessageCount = c.ChatAicontents.Count(),
                        LastQuestion = c.ChatAicontents
                            .OrderByDescending(m => m.CreatedAt)
                            .Select(m => m.Question)
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(new { success = true, data = chats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// POST: /api/chat-ai/{userId} - Tạo cuộc trò chuyện mới với AI
        /// </summary>
        [HttpPost("{userId}")]
        public async Task<IActionResult> CreateChat(int userId, [FromBody] CreateChatRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                // Kiểm tra authentication
                if (currentUserId == 0)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }
                
                // Kiểm tra authorization - chỉ được tạo chat cho chính mình
                if (currentUserId != userId)
                {
                    return Forbid();
                }

                var chat = await _geminiService.CreateChatSessionAsync(userId, request.Title);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        chatId = chat.ChatAiid,
                        title = chat.Title,
                        createdAt = chat.CreatedAt
                    },
                    message = "Tạo cuộc trò chuyện thành công"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// PUT: /api/chat-ai/{chatAiId} - Cập nhật title của cuộc trò chuyện
        /// </summary>
        [HttpPut("{chatAiId}")]
        public async Task<IActionResult> UpdateChatTitle(int chatAiId, [FromBody] UpdateChatTitleRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Kiểm tra authentication
                if (userId == 0)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }
                
                var chat = await _context.ChatAis
                    .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && c.UserId == userId && c.IsDeleted == false);

                if (chat == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy cuộc trò chuyện" });
                }

                if (string.IsNullOrWhiteSpace(request.Title))
                {
                    return BadRequest(new { success = false, message = "Tiêu đề không được để trống" });
                }

                chat.Title = request.Title;
                chat.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Cập nhật tiêu đề thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// DELETE: /api/chat-ai/{chatAiId} - Xóa cuộc trò chuyện
        /// </summary>
        [HttpDelete("{chatAiId}")]
        public async Task<IActionResult> DeleteChat(int chatAiId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var chat = await _context.ChatAis
                    .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && (userId == 0 || c.UserId == userId));

                if (chat == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy cuộc trò chuyện" });
                }

                chat.IsDeleted = true;
                chat.UpdatedAt = DateTime.Now;
                
                _context.ChatAis.Update(chat);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa cuộc trò chuyện thành công" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Delete chat error: {ex.Message}");
                Console.WriteLine($"❌ Inner exception: {ex.InnerException?.Message}");
                return StatusCode(500, new { success = false, message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        /// <summary>
        /// GET: /api/chat-ai/{chatAiId}/messages - Lấy lịch sử tin nhắn
        /// </summary>
        [HttpGet("{chatAiId}/messages")]
        public async Task<IActionResult> GetChatHistory(int chatAiId)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Kiểm tra authentication
                if (userId == 0)
                {
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                }
                
                var chat = await _context.ChatAis
                    .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && c.UserId == userId && c.IsDeleted == false);

                if (chat == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy cuộc trò chuyện" });
                }

                var messages = await _geminiService.GetChatHistoryAsync(chatAiId);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        chatTitle = chat.Title,
                        messages = messages.Select(m => new
                        {
                            contentId = m.ContentId,
                            question = m.Question,
                            answer = m.Answer,
                            createdAt = m.CreatedAt
                        })
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// POST: /api/chat-ai/{chatAiId}/messages - Gửi câu hỏi cho AI
        /// </summary>
        [HttpPost("{chatAiId}/messages")]
        public async Task<IActionResult> SendMessage(int chatAiId, [FromBody] SendMessageRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrWhiteSpace(request.Question))
                {
                    return BadRequest(new { success = false, message = "Câu hỏi không được để trống" });
                }

                // 🔒 CHECK DAILY LIMIT (Free: 30, VIP: 150)
                bool canAsk = await _dailyLimitService.CanPerformAction(userId, "ai_chat_question");
                if (!canAsk)
                {
                    int remaining = await _dailyLimitService.GetRemainingCount(userId, "ai_chat_question");
                    return StatusCode(429, new 
                    { 
                        success = false,
                        message = "Bạn đã hết lượt hỏi AI hôm nay! Nâng cấp lên VIP để sử dụng không giới hạn.",
                        remaining = remaining,
                        actionType = "ai_chat_question"
                    });
                }

                var answer = await _geminiService.SendMessageAsync(userId, chatAiId, request.Question);

                // 📝 RECORD ACTION TO DAILY LIMIT
                await _dailyLimitService.RecordAction(userId, "ai_chat_question");
                int remainingQuestions = await _dailyLimitService.GetRemainingCount(userId, "ai_chat_question");
                Console.WriteLine($"✅ AI question recorded. User {userId} has {remainingQuestions} questions remaining today.");

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        question = request.Question,
                        answer = answer,
                        timestamp = DateTime.Now
                    },
                    remainingQuestions = remainingQuestions // Trả về số lượt còn lại
                });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("not found") || ex.Message.Contains("access denied"))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // ============================================
    // DTOs
    // ============================================
    public class CreateChatRequest
    {
        public string? Title { get; set; }
    }

    public class UpdateChatTitleRequest
    {
        public string Title { get; set; }
    }

    public class SendMessageRequest
    {
        public string Question { get; set; }
    }
}
