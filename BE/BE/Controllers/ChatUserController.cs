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

        // GET /chat/{toUserId}?petId={petId}
        // Optional petId parameter to filter chats by specific pet
        [HttpGet("chat/{UserId}")]
        public async Task<IActionResult> GetChats(int UserId, [FromQuery] int? petId = null)
        {
            var query = _context.ChatUsers
                .Include(c => c.FromUser)
                .Include(c => c.ToUser)
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c => (c.FromUserId == UserId || c.ToUserId == UserId) && c.Status == "Accepted" && c.IsDeleted == false);

            // Filter by petId if provided (only show chats where this pet is involved)
            if (petId.HasValue)
            {
                query = query.Where(c => c.FromPetId == petId.Value || c.ToPetId == petId.Value);
            }

            var invites = await query
                .Select(c => new
                {
                    matchId = c.MatchId,
                    fromUserId = c.FromUserId,
                    toUserId = c.ToUserId,
                    fromPetId = c.FromPetId,
                    toPetId = c.ToPetId,
                    status = c.Status,
                    createdAt = c.CreatedAt,
                    // Return pet info for display
                    fromPet = c.FromPet != null ? new
                    {
                        petId = c.FromPet.PetId,
                        name = c.FromPet.Name,
                        breed = c.FromPet.Breed,
                        gender = c.FromPet.Gender
                    } : null,
                    toPet = c.ToPet != null ? new
                    {
                        petId = c.ToPet.PetId,
                        name = c.ToPet.Name,
                        breed = c.ToPet.Breed,
                        gender = c.ToPet.Gender
                    } : null
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

                // Ghi nhận action (nếu match thành công ngay lập tức thì vẫn tính là đã dùng 1 lần)
                await _limitService.RecordAction(fromUserId, "request_match");

                return Ok(new
                {
                    existing2.MatchId,
                    existing2.FromUserId,
                    existing2.ToUserId,
                    existing2.Status
                });
            }

            var chatUser = new ChatUser
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                Status = "Pending",
                IsDeleted = false,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };

            _context.ChatUsers.Add(chatUser);
            await _context.SaveChangesAsync();

            // Ghi nhận action đã thực hiện
            bool recorded = await _limitService.RecordAction(fromUserId, "request_match");

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
            chatUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

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

            Console.WriteLine($"[ChatUserController] Soft deleting chat matchId: {matchId}, Status: {chatUser.Status}");

            // Soft delete the ChatUser entry (keeps messages in DB for review)
            chatUser.IsDeleted = true;
            chatUser.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            
            await _context.SaveChangesAsync();

            Console.WriteLine($"[ChatUserController] Chat soft deleted successfully");
            return Ok(new { message = "Đã ẩn đoạn chat." });
        }
    }
}
