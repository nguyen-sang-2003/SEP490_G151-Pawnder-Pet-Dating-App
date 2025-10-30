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

   

            entity.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
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
