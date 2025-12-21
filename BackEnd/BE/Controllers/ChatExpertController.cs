using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
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
        [Authorize(Roles = "User,Admin")]
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

        /// <summary>
        /// Lấy danh sách chat của expert.
        /// Lưu ý: Chỉ trả về các chat đã tồn tại (đã được tạo khi user chọn chat với expert).
        /// Khi expert mới đăng nhập, nếu chưa có user nào chọn chat thì sẽ trả về danh sách rỗng [].
        /// </summary>
        // GET /chat-expert/expert/{expertId}
        [HttpGet("expert/{expertId}")]
        [Authorize(Roles = "Expert,Admin")]
        public async Task<IActionResult> GetChatsByExpertId(int expertId, CancellationToken ct = default)
        {
            try
            {
                Console.WriteLine($"[ChatExpertController] GET /chat-expert/expert/{expertId}");
                Console.WriteLine($"[ChatExpertController] User claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");
                
                // Chỉ trả về các chat đã tồn tại - không tự động tạo chat mới
                var chats = await _chatExpertService.GetChatsByExpertIdAsync(expertId, ct);
                
                var chatsList = chats.ToList();
                Console.WriteLine($"[ChatExpertController] Found {chatsList.Count} chats for expert {expertId}");
                
                // Trả về danh sách rỗng nếu chưa có chat nào (expert mới)
                return Ok(chatsList);
            }
            catch (KeyNotFoundException ex)
            {
                Console.WriteLine($"[ChatExpertController] Not found: {ex.Message}");
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatExpertController] Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        /// <summary>
        /// Tạo chat mới giữa expert và user.
        /// Endpoint này chỉ được gọi khi user chọn chat với expert (không tự động tạo khi expert đăng nhập).
        /// Nếu chat đã tồn tại thì trả về chat hiện có.
        /// </summary>
        // POST /chat-expert/{expertId}/{userId}
        [HttpPost("{expertId}/{userId}")]
        [Authorize(Roles = "User,Expert")]
        public async Task<IActionResult> CreateChat(int expertId, int userId, CancellationToken ct = default)
        {
            try
            {
                Console.WriteLine($"[ChatExpertController] POST /chat-expert/{expertId}/{userId} - User {userId} wants to chat with Expert {expertId}");
                var result = await _chatExpertService.CreateChatAsync(expertId, userId, ct);
                Console.WriteLine($"[ChatExpertController] Chat created/retrieved successfully");
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

