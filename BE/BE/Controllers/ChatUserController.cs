using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatUserController : Controller
    {
        private readonly PawnderDatabaseContext _context;

        public ChatUserController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // GET /invite/{toUserId}
        [HttpGet("invite/{toUserId}")]
        public async Task<IActionResult> GetInvites(int toUserId)
        {
            var invites = await _context.ChatUsers
                .Include(c => c.FromUser)
                .Where(c => c.ToUserId == toUserId && c.Status == "Pending")
                .Select(c => new
                {
                    matchId = c.MatchId,
                    fromUserId = c.FromUserId,
                    status = c.Status,
                    createdAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(invites);
        }

        // GET /chat/{toUserId}
        [HttpGet("chat/{UserId}")]
        public async Task<IActionResult> GetChats(int UserId)
        {
            var invites = await _context.ChatUsers
                .Include(c => c.FromUser)
                .Where(c => (c.FromUserId == UserId || c.ToUserId == UserId) && c.Status == "Accepted")
                .Select(c => new
                {
                    matchId = c.MatchId,
                    fromUserId = c.FromUserId,
                    toUserId = c.ToUserId,
                    status = c.Status,
                    createdAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(invites);
        }

        // POST /invite/{fromUserId}/{toUserId}
        [HttpPost("invite/{fromUserId}/{toUserId}")]
        public async Task<IActionResult> CreateFriendRequest(int fromUserId, int toUserId)
        {
            if (fromUserId == toUserId)
                return BadRequest(new { message = "Không thể gửi yêu cầu cho chính mình." });

            //gui 
            var existing1 = await _context.ChatUsers.FirstOrDefaultAsync(c =>
                c.FromUserId == fromUserId && c.ToUserId == toUserId && c.IsDeleted == false);

            if (existing1 != null)
                return BadRequest(new { message = "Yêu cầu này đã tồn tại." });
            
            //da nhan
            var existing2 = await _context.ChatUsers.FirstOrDefaultAsync(c =>
                c.FromUserId == toUserId && c.ToUserId == fromUserId && c.IsDeleted == false);
            if (existing2 != null)
            {
                existing2.Status = "Accepted";
                _context.ChatUsers.Update(existing2);
                await _context.SaveChangesAsync();
                return Ok(new
                {
                    existing2.MatchId,
                    existing2.FromUserId,
                    existing2.ToUserId,
                    existing2.Status,
                    existing2.CreatedAt
                });
            }

            var chatUser = new ChatUser
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                Status = "Pending",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatUsers.Add(chatUser);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                chatUser.MatchId,
                chatUser.FromUserId,
                chatUser.ToUserId,
                chatUser.Status,
                chatUser.CreatedAt
            });
        }

        // PUT /invite/{matchId}
        // ===============================
        [HttpPut("invite/{matchId}")]
        public async Task<IActionResult> UpdateFriendRequest(int matchId)
        {
            var chatUser = await _context.ChatUsers.FirstOrDefaultAsync(cu => cu.MatchId == matchId && cu.Status == "Pending");
            if (chatUser == null)
                return NotFound(new { message = "Không tìm thấy yêu cầu kết bạn." });

            chatUser.Status = "Accepted";
            chatUser.UpdatedAt = DateTime.Now;

            _context.ChatUsers.Update(chatUser);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                chatUser.MatchId,
                chatUser.FromUserId,
                chatUser.ToUserId,
                chatUser.Status,
                chatUser.UpdatedAt
            });
        }

        // DELETE /invite/{matchId}
        [HttpDelete("invite/{matchId}")]
        public async Task<IActionResult> DeleteFriendRequest(int matchId)
        {
            var chatUser = await _context.ChatUsers.FirstOrDefaultAsync(cu => cu.MatchId == matchId && cu.Status == "Pending");
            if (chatUser == null)
                return NotFound(new { message = "Không tìm thấy yêu cầu kết bạn." });

            _context.ChatUsers.Remove(chatUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa yêu cầu kết bạn." });
        }

        // DELETE /chat/{matchId}
        [HttpDelete("chat/{matchId}")]
        public async Task<IActionResult> DeleteChat(int matchId)
        {
            var chatUser = await _context.ChatUsers.FirstOrDefaultAsync(cu => cu.MatchId == matchId && cu.IsDeleted == false);
            if (chatUser == null)
                return NotFound(new { message = "Không tìm thấy đoạn chat." });

            Console.WriteLine($"[ChatUserController] Deleting chat matchId: {matchId}, Status: {chatUser.Status}");

            // Hard delete all chat messages first
            var chatMessages = await _context.ChatUserContents
                .Where(m => m.MatchId == matchId)
                .ToListAsync();
            
            if (chatMessages.Any())
            {
                _context.ChatUserContents.RemoveRange(chatMessages);
                Console.WriteLine($"[ChatUserController] Deleted {chatMessages.Count} messages");
            }

            // Hard delete the ChatUser entry (unmatch completely)
            _context.ChatUsers.Remove(chatUser);
            await _context.SaveChangesAsync();

            Console.WriteLine($"[ChatUserController] Chat deleted completely");
            return Ok(new { message = "Đã xóa yêu đoạn chat." });
        }
    }
}
