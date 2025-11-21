using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho ChatAI - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/chat-ai")]
    [Authorize(Roles = "User,Admin,Expert")]
    public class ChatAIController : ControllerBase
    {
        private readonly IChatAIService _chatAIService;

        public ChatAIController(IChatAIService chatAIService)
        {
            _chatAIService = chatAIService;
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

        // GET: /api/chat-ai/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetAllChats(int userId, CancellationToken ct = default)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                if (currentUserId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                
                if (currentUserId != userId)
                    return Forbid();

                var chats = await _chatAIService.GetAllChatsAsync(userId, ct);
                return Ok(new { success = true, data = chats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /api/chat-ai/{userId}
        [HttpPost("{userId}")]
        public async Task<IActionResult> CreateChat(int userId, [FromBody] CreateChatRequest request, CancellationToken ct = default)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                if (currentUserId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                
                if (currentUserId != userId)
                    return Forbid();

                var data = await _chatAIService.CreateChatAsync(userId, request.Title, ct);
                return Ok(new
                {
                    success = true,
                    data = data,
                    message = "Tạo cuộc trò chuyện thành công"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // PUT: /api/chat-ai/{chatAiId}
        [HttpPut("{chatAiId}")]
        public async Task<IActionResult> UpdateChatTitle(int chatAiId, [FromBody] UpdateChatTitleRequest request, CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _chatAIService.UpdateChatTitleAsync(chatAiId, userId, request.Title, ct);
                return Ok(new { success = true, message = "Cập nhật tiêu đề thành công" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DELETE: /api/chat-ai/{chatAiId}
        [HttpDelete("{chatAiId}")]
        public async Task<IActionResult> DeleteChat(int chatAiId, CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserId();
                var success = await _chatAIService.DeleteChatAsync(chatAiId, userId, ct);
                return Ok(new { success = true, message = "Xóa cuộc trò chuyện thành công" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // GET: /api/chat-ai/{chatAiId}/messages
        [HttpGet("{chatAiId}/messages")]
        public async Task<IActionResult> GetChatHistory(int chatAiId, CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var data = await _chatAIService.GetChatHistoryAsync(chatAiId, userId, ct);
                return Ok(new { success = true, data = data });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /api/chat-ai/{chatAiId}/messages
        [HttpPost("{chatAiId}/messages")]
        public async Task<IActionResult> SendMessage(int chatAiId, [FromBody] SendMessageRequest request, CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserId();

                var data = await _chatAIService.SendMessageAsync(chatAiId, userId, request.Question, ct);
                return Ok(new
                {
                    success = true,
                    data = data
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("hết lượt"))
                {
                    return StatusCode(429, new
                    {
                        success = false,
                        message = ex.Message,
                        actionType = "ai_chat_question"
                    });
                }
                return BadRequest(new { success = false, message = ex.Message });
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

    // DTOs
    public class CreateChatRequest
    {
        public string? Title { get; set; }
    }

    public class UpdateChatTitleRequest
    {
        public string Title { get; set; } = null!;
    }

    public class SendMessageRequest
    {
        public string Question { get; set; } = null!;
    }
}
