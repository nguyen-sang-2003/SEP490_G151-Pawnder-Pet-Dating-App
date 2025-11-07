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
    // [Authorize] // TẠM THỜI BỎ ĐỂ TEST
    public class ChatAIController : ControllerBase
    {
        private readonly IGeminiAIService _geminiService;
        private readonly PawnderDatabaseContext _context;

        public ChatAIController(IGeminiAIService geminiService, PawnderDatabaseContext context)
        {
            _geminiService = geminiService;
            _context = context;
        }

        private int GetCurrentUserId()
        {
            // CÁCH 1: Lấy từ JWT token (khi đã setup authentication)
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                return int.Parse(userIdClaim);
            }

            // CÁCH 2: Tạm thời hardcode để test (XÓA KHI PRODUCTION)
            return 1; // Hoặc userId bất kỳ tồn tại trong DB
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
                chat.UpdatedAt = DateTime.UtcNow;
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
                    .FirstOrDefaultAsync(c => c.ChatAiid == chatAiId && c.UserId == userId);

                if (chat == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy cuộc trò chuyện" });
                }

                chat.IsDeleted = true;
                chat.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Xóa cuộc trò chuyện thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
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

                var answer = await _geminiService.SendMessageAsync(userId, chatAiId, request.Question);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        question = request.Question,
                        answer = answer,
                        timestamp = DateTime.UtcNow
                    }
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
