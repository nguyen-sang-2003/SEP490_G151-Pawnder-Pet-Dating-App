using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [Route("admin/users")]
    [ApiController]
    public class AdminsController : ControllerBase
    {
        private readonly PawnderDatabaseContext _db;

        public AdminsController(PawnderDatabaseContext db)
        {
            _db = db;
        }

        // Admin reassign expert confirmation to another expert
        [HttpPost("expert-confirmation/reassign")]
        public async Task<ActionResult<ReassignExpertConfirmationResponse>> ReassignExpertConfirmation(
            [FromBody] ReassignExpertConfirmationRequest req,
            CancellationToken ct = default)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == req.UserId, ct);
            if (user == null) return NotFound(new { message = "Không tìm thấy user." });

            var chat = await _db.ChatAis.AsNoTracking().FirstOrDefaultAsync(c => c.ChatAiid == req.ChatAiId, ct);
            if (chat == null) return NotFound(new { message = "Không tìm thấy ChatAI." });

            var toExpert = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == req.ToExpertId, ct);
            if (toExpert == null) return NotFound(new { message = "Không tìm thấy chuyên gia đích." });

            // Find existing confirmation; optionally constrain by FromExpertId if provided
            var existingQuery = _db.ExpertConfirmations
                .Where(ec => ec.UserId == req.UserId && ec.ChatAiid == req.ChatAiId);
            if (req.FromExpertId.HasValue)
            {
                existingQuery = existingQuery.Where(ec => ec.ExpertId == req.FromExpertId.Value);
            }
            var existing = await existingQuery.FirstOrDefaultAsync(ct);
            if (existing == null)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu xác nhận hiện tại để chuyển." });
            }
            // Only allow reassign when current status is 'pending'
            if (!string.Equals(existing.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Chỉ cho phép chuyển yêu cầu khi trạng thái là 'pending'." });
            }

            // If already assigned to target expert, short-circuit
            if (existing.ExpertId == req.ToExpertId)
            {
                return Ok(new ReassignExpertConfirmationResponse
                {
                    UserId = existing.UserId,
                    ChatAiId = existing.ChatAiid,
                    ExpertId = existing.ExpertId,
                    Status = existing.Status,
                    Message = existing.Message,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = existing.UpdatedAt,
                    ResultMessage = "Yêu cầu đã thuộc về chuyên gia này."
                });
            }

            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var newStatus = req.KeepStatus ? existing.Status : "pending";
            var newMessage = string.IsNullOrWhiteSpace(req.Message) ? existing.Message : req.Message;

            // Remove the old composite-key row and create a new one with new ExpertId
            _db.ExpertConfirmations.Remove(existing);
            var reassigned = new ExpertConfirmation
            {
                UserId = req.UserId,
                ChatAiid = req.ChatAiId,
                ExpertId = req.ToExpertId,
                Status = newStatus,
                Message = newMessage,
                CreatedAt = existing.CreatedAt ?? now,
                UpdatedAt = now
            };
            _db.ExpertConfirmations.Add(reassigned);
            await _db.SaveChangesAsync(ct);

            return Ok(new ReassignExpertConfirmationResponse
            {
                UserId = reassigned.UserId,
                ChatAiId = reassigned.ChatAiid,
                ExpertId = reassigned.ExpertId,
                Status = reassigned.Status,
                Message = reassigned.Message,
                CreatedAt = reassigned.CreatedAt,
                UpdatedAt = reassigned.UpdatedAt,
                ResultMessage = "Đã chuyển yêu cầu xác nhận sang chuyên gia khác."
            });
        }

        // Ban a user by days or permanently
        [HttpPost("{id:int}/ban")]
        public async Task<ActionResult> BanUser([FromRoute] int id, [FromBody] BanUserRequest req, CancellationToken ct = default)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
            if (user == null) return NotFound(new { message = "Không tìm thấy user." });

            // calculate banEnd
            var now = DateTime.Now;
            DateTime? banEnd = null;
            var isPermanent = req.IsPermanent == true;
            if (!isPermanent)
            {
                var days = Math.Max(0, req.DurationDays);
                if (days <= 0) return BadRequest(new { message = "Cần truyền số ngày (DurationDays > 0) hoặc IsPermanent = true." });
                banEnd = now.AddDays(days);
            }

            // Check if user already has an active ban (still effective)
            var activeBans = await _db.UserBanHistories
                .Where(b => b.UserId == id && (b.IsActive == true))
                .ToListAsync(ct);
            var hasStillEffectiveBan = activeBans.Any(b => !b.BanEnd.HasValue || b.BanEnd.Value > now);
            if (hasStillEffectiveBan)
            {
                var current = activeBans
                    .OrderByDescending(b => b.BanStart)
                    .First();
                return BadRequest(new
                {
                    message = "Người dùng đang bị khóa, không thể tạo lệnh khóa mới.",
                    banStart = current.BanStart,
                    banEnd = current.BanEnd,
                    reason = current.BanReason
                });
            }

            // Deactivate any 'active' bans that are already expired (cleanup)
            foreach (var b in activeBans)
            {
                b.IsActive = false;
                b.BanEnd = b.BanEnd ?? now;
                b.UpdatedAt = now;
            }

            // create new ban
            var entry = new BE.Models.UserBanHistory
            {
                UserId = id,
                BanStart = now,
                BanEnd = banEnd,
                BanReason = req.Reason,
                CreatedAt = now,
                UpdatedAt = now,
                IsActive = true
            };

            _db.UserBanHistories.Add(entry);
            // Set user status to 'Bị khóa' if exists
            {
                var bannedStatus = await _db.UserStatuses
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => EF.Functions.ILike(s.UserStatusName, "Bị khóa"), ct);
                if (bannedStatus != null)
                {
                    user.UserStatusId = bannedStatus.UserStatusId;
                    user.UpdatedAt = now;
                }
            }
            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                message = isPermanent ? "Đã khóa vĩnh viễn người dùng." : "Đã khóa tạm thời người dùng.",
                banStart = entry.BanStart,
                banEnd = entry.BanEnd
            });
        }

        // Unban a user now
        [HttpPost("{id:int}/unban")]
        public async Task<ActionResult> UnbanUser([FromRoute] int id, [FromBody] UnbanUserRequest? req, CancellationToken ct = default)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
            if (user == null) return NotFound(new { message = "Không tìm thấy user." });

            var now = DateTime.Now;
            var actives = await _db.UserBanHistories
                .Where(b => b.UserId == id && (b.IsActive == true))
                .ToListAsync(ct);
            if (actives.Count == 0) return Ok(new { message = "Người dùng hiện không bị khóa." });

            foreach (var b in actives)
            {
                b.IsActive = false;
                b.BanEnd = now;
                b.BanReason = string.IsNullOrWhiteSpace(req?.Reason) ? b.BanReason : $"{b.BanReason} | Unban: {req!.Reason}";
                b.UpdatedAt = now;
            }

            // Set user status back based on payment history: VIP or Thường
            {
                var hasPaymentHistory = await _db.PaymentHistories
                    .AsNoTracking()
                    .AnyAsync(ph => ph.UserId == id, ct);

                var targetStatusName = hasPaymentHistory ? "Tài khoản VIP" : "Tài khoản thường";
                var targetStatus = await _db.UserStatuses
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => EF.Functions.ILike(s.UserStatusName, targetStatusName), ct);

                if (targetStatus != null)
                {
                    user.UserStatusId = targetStatus.UserStatusId;
                    user.UpdatedAt = now;
                }
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Đã mở khóa người dùng." });
        }

        // List ban histories of a user
        [HttpGet("{id:int}/bans")]
        public async Task<ActionResult> GetUserBans([FromRoute] int id, CancellationToken ct = default)
        {
            var exists = await _db.Users.AnyAsync(u => u.UserId == id, ct);
            if (!exists) return NotFound(new { message = "Không tìm thấy user." });

            var items = await _db.UserBanHistories
                .AsNoTracking()
                .Where(b => b.UserId == id)
                .OrderByDescending(b => b.BanStart)
                .Select(b => new
                {
                    b.BanId,
                    b.BanStart,
                    b.BanEnd,
                    b.BanReason,
                    b.IsActive,
                    b.CreatedAt,
                    b.UpdatedAt
                })
                .ToListAsync(ct);

            return Ok(items);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult> UpdateUserByAdmin(
     [FromRoute] int id,
     [FromBody] AdUserUpdateRequest request,
     CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var entity = await _db.Users.FirstOrDefaultAsync(u => u.UserId == id, ct);
            if (entity == null)
                return NotFound(new { message = "Không tìm thấy user." });

            // Cập nhật có điều kiện
            if (request.isDelete.HasValue)
                entity.IsDeleted = request.isDelete.Value;

            if (request.userStatusId.HasValue)
                entity.UserStatusId = request.userStatusId.Value;

   

            entity.UpdatedAt = DateTime.Now;
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Cập nhật người dùng thành công." });
        }
        [HttpPost]
        public async Task<ActionResult<UserResponse>> Register(
      [FromBody] AdUserCreateRequest req,
      CancellationToken ct = default)
        {
            // unique email
            var emailExists = await _db.Users
                .AnyAsync(u => u.Email == req.Email && (u.IsDeleted == null || u.IsDeleted == false), ct);
            if (emailExists)
                return Conflict(new { message = "Email đã tồn tại" });

            // Hash password – tuỳ thư viện bạn dùng. Ví dụ BCrypt.Net-Next:
            // var hashed = BCrypt.Net.BCrypt.HashPassword(req.Password);
            // Nếu bạn đã hash ở nơi khác, hãy gán trực tiếp PasswordHash.
            var hashed = BCrypt.Net.BCrypt.HashPassword(req.Password);

            var entity = new BE.Models.User
            {
                RoleId = req.RoleId,
                UserStatusId = 1,
                FullName = req.FullName,
                Gender = req.Gender,
                Email = req.Email,
                PasswordHash = hashed,
               
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _db.Users.Add(entity);
            await _db.SaveChangesAsync(ct);

            var resp = new UserResponse
            {

                RoleId = entity.RoleId,
                UserStatusId = entity.UserStatusId,
                AddressId = entity.AddressId,
                FullName = entity.FullName,
                Gender = entity.Gender,
                Email = entity.Email,
                ProviderLogin = entity.ProviderLogin,
                IsDeleted = entity.IsDeleted ?? false,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };

            return CreatedAtAction(nameof(Register), new { userId = resp.UserId }, resp);
        }

    }
}
