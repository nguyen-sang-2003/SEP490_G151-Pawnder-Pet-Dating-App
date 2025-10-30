using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatUserContentController : Controller
    {
        private readonly PawnderDatabaseContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatUserContentController(PawnderDatabaseContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
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
            try
            {
                Console.WriteLine($"[SendMessage] Start - matchId={matchId}, fromUserId={fromUserId}, message length={message?.Length}");

                if (string.IsNullOrWhiteSpace(message))
                {
                    Console.WriteLine("[SendMessage] Empty message");
                    return BadRequest(new { message = "Tin nhắn không được để trống." });
                }

                Console.WriteLine($"[SendMessage] Checking match existence...");
                var match = await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == matchId && c.Status == "Accepted" && c.IsDeleted == false);
                if (match == null)
                {
                    Console.WriteLine($"[SendMessage] Match not found - matchId={matchId}");
                    return NotFound(new { message = "Không tồn tại đoạn chat." });
                }

                Console.WriteLine($"[SendMessage] Match found - FromUserId={match.FromUserId}, ToUserId={match.ToUserId}");

                // Check if user exists
                var userExists = await _context.Users.AnyAsync(u => u.UserId == fromUserId);
                if (!userExists)
                {
                    Console.WriteLine($"[SendMessage] User not found - fromUserId={fromUserId}");
                    return BadRequest(new { message = $"User {fromUserId} không tồn tại trong hệ thống." });
                }

                Console.WriteLine($"[SendMessage] Creating message entity...");
                var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
                var chatMessage = new ChatUserContent
                {
                    MatchId = matchId,
                    FromUserId = fromUserId,
                    Message = message,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                Console.WriteLine($"[SendMessage] Adding to context...");
                _context.ChatUserContents.Add(chatMessage);
                
                Console.WriteLine($"[SendMessage] Saving changes...");
                await _context.SaveChangesAsync();

                Console.WriteLine($"[SendMessage] Success - contentId={chatMessage.ContentId}");

                // Send realtime notification via SignalR
                var groupName = $"Match_{matchId}";
                Console.WriteLine($"[SendMessage] Broadcasting to group: {groupName}");
                
                await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", new
                {
                    MatchId = matchId,
                    FromUserId = fromUserId,
                    Message = message,
                    CreatedAt = chatMessage.CreatedAt
                });
                
                Console.WriteLine($"[SendMessage] Broadcast complete");

                return Ok(new
                {
                    message = "Gửi tin nhắn thành công.",
                    contentId = chatMessage.ContentId,
                    createdAt = chatMessage.CreatedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SendMessage] ERROR: {ex.Message}");
                Console.WriteLine($"[SendMessage] Stack: {ex.StackTrace}");
                
                var innerEx = ex.InnerException;
                while (innerEx != null)
                {
                    Console.WriteLine($"[SendMessage] Inner Exception: {innerEx.Message}");
                    innerEx = innerEx.InnerException;
                }

                return StatusCode(500, new { 
                    message = "Lỗi server khi gửi tin nhắn",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

    }
}
