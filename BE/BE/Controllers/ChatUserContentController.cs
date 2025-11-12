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
                .Include(c => c.FromPet)
                .Where(c => c.MatchId == matchId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.ContentId,
                    c.MatchId,
                    c.FromPetId,
                    FromPetName = c.FromPet != null ? c.FromPet.Name : null,
                    c.Message,
                    c.CreatedAt
                })
                .ToListAsync();

            if (!messages.Any())
                return NotFound(new { message = "Không tìm thấy nội dung trò chuyện." });

            return Ok(messages);
        }

        // POST /chat-user-content/{matchId}/{fromPetId}
        [HttpPost("chat-user-content/{matchId}/{fromPetId}")]
        public async Task<IActionResult> SendMessage(int matchId, int fromPetId, [FromBody] string message)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(message))
                {
                    return BadRequest(new { message = "Tin nhắn không được để trống." });
                }

                var match = await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == matchId && c.Status == "Accepted" && c.IsDeleted == false);
                if (match == null)
                {
                    return NotFound(new { message = "Không tồn tại đoạn chat." });
                }

                if (match.FromPetId != fromPetId && match.ToPetId != fromPetId)
                {
                    return BadRequest(new { message = "Pet không thuộc cuộc chat này." });
                }

                var now = DateTime.Now;
                var chatMessage = new ChatUserContent
                {
                    MatchId = matchId,
                    FromPetId = fromPetId,
                    Message = message,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.ChatUserContents.Add(chatMessage);
                await _context.SaveChangesAsync();

                var groupName = $"Match_{matchId}";
                await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", new
                {
                    MatchId = matchId,
                    FromPetId = fromPetId,
                    Message = message,
                    CreatedAt = chatMessage.CreatedAt
                });

                int? toUserId = null;
                if (match.FromPetId == fromPetId)
                {
                    toUserId = match.ToUserId;
                }
                else if (match.ToPetId == fromPetId)
                {
                    toUserId = match.FromUserId;
                }

                if (toUserId.HasValue)
                {
                    try
                    {
                        await ChatHub.SendNewMessageBadge(_hubContext, toUserId.Value, matchId, match.FromPetId, match.ToPetId);
                    }
                    catch (Exception notifEx)
                    {
                        Console.WriteLine($"[SendMessage] Error sending badge notification: {notifEx.Message}");
                    }
                }

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
