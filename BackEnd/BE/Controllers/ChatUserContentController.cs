using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho ChatUserContent - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ChatUserContentController : Controller
    {
        private readonly IChatUserContentService _contentService;

        public ChatUserContentController(IChatUserContentService contentService)
        {
            _contentService = contentService;
        }

        // GET /chat-user-content/{matchId}
        [HttpGet("chat-user-content/{matchId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetChatMessages(int matchId, CancellationToken ct = default)
        {
            try
            {
                var messages = await _contentService.GetChatMessagesAsync(matchId, ct);
                return Ok(messages);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /chat-user-content/{matchId}/{fromUserId}
        [HttpPost("chat-user-content/{matchId}/{fromUserId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> SendMessage(int matchId, int fromUserId, [FromBody] string message, CancellationToken ct = default)
        {
            try
            {
                var result = await _contentService.SendMessageAsync(matchId, fromUserId, message, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi server khi gửi tin nhắn",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }
    }
}
