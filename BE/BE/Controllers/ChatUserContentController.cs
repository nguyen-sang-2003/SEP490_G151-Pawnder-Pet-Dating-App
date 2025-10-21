using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatUserContentController : Controller
    {
        private readonly PawnderDatabaseContext _context;

        public ChatUserContentController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // GET /chat-user-content/{matchId}
        [HttpGet("chat-user-content/{matchId}")]
        public async Task<IActionResult> GetChatMessages(int matchId)
        {
            var exitChat = await _context.ChatUsers.AnyAsync(c => c.MatchId == matchId && c.Status == "Accepted" && c.IsDeleted == false);
            if(!exitChat)
            {
                return NotFound(new { message = "Không tìm thấy đoạn chat." });
            }

            var messages = await _context.ChatUserContents
                .Where(c => c.MatchId == matchId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.ContentId,
                    c.MatchId,
                    c.FromUserId,
                    FromUserName = c.FromUser != null ? c.FromUser.FullName : null,
                    c.Message,
                    c.CreatedAt
                })
                .ToListAsync();

            if (!messages.Any())
                return NotFound(new { message = "Không tìm thấy nội dung trò chuyện." });

            return Ok(messages);
        }

        // POST /chat-user-content/{matchId}/{fromUserId}
        [HttpPost("chat-user-content/{matchId}/{fromUserId}")]
        public async Task<IActionResult> SendMessage(int matchId, int fromUserId, [FromBody] string message)
        {

            if (string.IsNullOrWhiteSpace(message))
                return BadRequest(new { message = "Tin nhắn không được để trống." });

            var match = await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId==matchId && c.Status == "Accepted" && c.IsDeleted == false);
            if (match == null)
                return NotFound(new { message = "Không tồn tại đoạn chat." });

            var chatMessage = new ChatUserContent
            {
                MatchId = matchId,
                FromUserId = fromUserId,
                Message = message,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.ChatUserContents.Add(chatMessage);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Gửi tin nhắn thành công."
            });
        }

    }
}
