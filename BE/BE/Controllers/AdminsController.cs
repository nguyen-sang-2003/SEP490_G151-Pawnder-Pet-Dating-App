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
