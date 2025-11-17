using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho ChatExpertContent - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ChatExpertContentController : Controller
    {
        private readonly IChatExpertContentService _contentService;

        public ChatExpertContentController(IChatExpertContentService contentService)
        {
            _contentService = contentService;
        }

        // GET /chat-expert-content/{chatExpertId}
        [HttpGet("{chatExpertId}")]
        [Authorize(Roles = "User,Expert,Admin")]
        public async Task<IActionResult> GetChatMessages(int chatExpertId, CancellationToken ct = default)
        {
            try
            {
                var messages = await _contentService.GetChatMessagesAsync(chatExpertId, ct);
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

        // POST /chat-expert-content/{chatExpertId}/{fromId}
        [HttpPost("{chatExpertId}/{fromId}")]
        [Authorize(Roles = "User,Expert")]
        public async Task<IActionResult> SendMessage(
            int chatExpertId, 
            int fromId, 
            [FromBody] SendMessageRequestChatExpert request, 
            CancellationToken ct = default)
        {
            try
            {
                var result = await _contentService.SendMessageAsync(
                    chatExpertId, 
                    fromId, 
                    request.Message, 
                    request.ExpertId, 
                    request.UserId, 
                    request.ChatAiid, 
                    ct);
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

