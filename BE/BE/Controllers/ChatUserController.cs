using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatUserController : Controller
    {
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _limitService;

        public ChatUserController(PawnderDatabaseContext context, DailyLimitService limitService)
        {
            _context = context;
            _limitService = limitService;
        }

        // GET /invite/{userId} – lấy tất cả lời mời gửi tới các pet của user
        [HttpGet("invite/{userId}")]
        public async Task<IActionResult> GetInvites(int userId)
        {
            var petIds = await _context.Pets
                .Where(p => p.UserId == userId && (p.IsDeleted == false))
                .Select(p => p.PetId)
                .ToListAsync();

            if (!petIds.Any())
            {
                return Ok(new List<object>());
            }

            var petIdSet = petIds.ToHashSet();

            var invites = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c =>
                    c.Status == "Pending" &&
                    c.IsDeleted == false &&
                    c.ToPetId.HasValue &&
                    petIdSet.Contains(c.ToPetId.Value))
                .Select(c => new
                {
                    matchId = c.MatchId,
                    fromPetId = c.FromPetId,
                    fromPetName = c.FromPet != null ? c.FromPet.Name : null,
                    toPetId = c.ToPetId,
                    toPetName = c.ToPet != null ? c.ToPet.Name : null,
                    status = c.Status,
                    createdAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(invites);
        }

        // GET /chat/{userId} – lấy tất cả đoạn chat Accepted của các pet thuộc user
        [HttpGet("chat/{userId}")]
        public async Task<IActionResult> GetChats(int userId)
        {
            var petIds = await _context.Pets
                .Where(p => p.UserId == userId && p.IsDeleted == false)
                .Select(p => p.PetId)
                .ToListAsync();

            if (!petIds.Any())
            {
                return Ok(new List<object>());
            }

            var petIdSet = petIds.ToHashSet();

            var chats = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c =>
                    c.Status == "Accepted" &&
                    c.IsDeleted == false &&
                    (
                        (c.FromPetId.HasValue && petIdSet.Contains(c.FromPetId.Value)) ||
                        (c.ToPetId.HasValue && petIdSet.Contains(c.ToPetId.Value))
                    ))
                .Select(c => new
                {
                    matchId = c.MatchId,
                    fromPetId = c.FromPetId,
                    fromPetName = c.FromPet != null ? c.FromPet.Name : null,
                    toPetId = c.ToPetId,
                    toPetName = c.ToPet != null ? c.ToPet.Name : null,
                    status = c.Status,
                    createdAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(chats);
        }

        // POST /invite/{fromPetId}/{toPetId}
        [HttpPost("invite/{fromPetId}/{toPetId}")]
        public async Task<IActionResult> CreateFriendRequest(int fromPetId, int toPetId)
        {
            if (fromPetId == toPetId)
                return BadRequest(new { message = "Không thể gửi yêu cầu cho chính mình." });

            // Lấy UserId từ Pet để kiểm tra limit
            var fromPet = await _context.Pets
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.PetId == fromPetId);
            
            if (fromPet == null || fromPet.User == null)
                return NotFound(new { message = "Không tìm thấy pet hoặc user của pet." });

            int fromUserId = fromPet.User.UserId;

            // Kiểm tra limit trước khi gửi request match
            bool canPerform = await _limitService.CanPerformAction(fromUserId, "request_match");
            if (!canPerform)
            {
                int remaining = await _limitService.GetRemainingCount(fromUserId, "request_match");
                return BadRequest(new 
                { 
                    message = "Đã vượt quá giới hạn gửi lời mời kết bạn trong ngày.",
                    remaining = remaining
                });
            }

            //gui 
            var existing1 = await _context.ChatUsers.FirstOrDefaultAsync(c =>
                c.FromPetId == fromPetId && c.ToPetId == toPetId && c.IsDeleted == false);

            if (existing1 != null)
                return BadRequest(new { message = "Yêu cầu này đã tồn tại." });
            
            //da nhan
            var existing2 = await _context.ChatUsers.FirstOrDefaultAsync(c =>
                c.FromPetId == toPetId && c.ToPetId == fromPetId && c.IsDeleted == false);
            if (existing2 != null)
            {
                existing2.Status = "Accepted";
                _context.ChatUsers.Update(existing2);
                await _context.SaveChangesAsync();

                // Ghi nhận action (nếu match thành công ngay lập tức thì vẫn tính là đã dùng 1 lần)
                await _limitService.RecordAction(fromUserId, "request_match");

                return Ok(new
                {
                    existing2.MatchId,
                    existing2.FromPetId,
                    existing2.ToPetId,
                    existing2.Status
                });
            }

            var chatUser = new ChatUser
            {
                FromPetId = fromPetId,
                ToPetId = toPetId,
                Status = "Pending",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatUsers.Add(chatUser);
            await _context.SaveChangesAsync();

            // Ghi nhận action đã thực hiện
            bool recorded = await _limitService.RecordAction(fromUserId, "request_match");

            return Ok(new
            {
                chatUser.MatchId,
                chatUser.FromPetId,
                chatUser.ToPetId,
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
                chatUser.FromPetId,
                chatUser.ToPetId,
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
            var chatUser = await _context.ChatUsers.FirstOrDefaultAsync(cu => cu.MatchId == matchId && cu.Status == "Accepted");
            if (chatUser == null)
                return NotFound(new { message = "Không tìm thấy đoạn chat." });

            chatUser.IsDeleted = true;
            _context.ChatUsers.Update(chatUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa yêu đoạn chat." });
        }
    }
}
