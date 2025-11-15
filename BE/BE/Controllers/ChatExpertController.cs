using BE.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho ChatExpert - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ChatExpertController : Controller
    {
        private readonly IChatExpertService _chatExpertService;

        public ChatExpertController(IChatExpertService chatExpertService)
        {
            _chatExpertService = chatExpertService;
        }

        // GET /chat-expert/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetChatsByUserId(int userId, CancellationToken ct = default)
        {
            try
            {
                var chats = await _chatExpertService.GetChatsByUserIdAsync(userId, ct);
                return Ok(chats);
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

        // GET /chat-expert/expert/{expertId}
        [HttpGet("expert/{expertId}")]
        public async Task<IActionResult> GetChatsByExpertId(int expertId, CancellationToken ct = default)
        {
            try
            {
                var chats = await _chatExpertService.GetChatsByExpertIdAsync(expertId, ct);
                return Ok(chats);
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

        // POST /chat-expert/{expertId}/{userId}
        [HttpPost("{expertId}/{userId}")]
        public async Task<IActionResult> CreateChat(int expertId, int userId, CancellationToken ct = default)
        {
            try
            {
                var result = await _chatExpertService.CreateChatAsync(expertId, userId, ct);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
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
    }
}

