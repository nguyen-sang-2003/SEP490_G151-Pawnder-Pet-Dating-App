using System.Net.Mime;
using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers;

[ApiController]
[Route("user")] // khớp bảng mô tả: /user thay vì /api/users
[Produces(MediaTypeNames.Application.Json)]
public class UserController : ControllerBase
{
    private readonly PawnderDatabaseContext _db;

    public UserController(PawnderDatabaseContext db)
    {
        _db = db;
    }

    // GET /user?search=&roleId=&statusId=&page=1&pageSize=20&includeDeleted=false
    [HttpGet]
   
    public async Task<ActionResult<PagedResult<UserResponse>>> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int? roleId,
        [FromQuery] int? statusId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool includeDeleted = false,
        CancellationToken ct = default)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 200) pageSize = 20;

        var q = _db.Users.AsNoTracking();

        if (!includeDeleted)
            q = q.Where(u => u.IsDeleted == null || u.IsDeleted == false);

        // Exclude Admin users from the listing
        q = q.Where(u => u.Role == null || u.Role.RoleName != "Admin");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            // PostgreSQL: dùng ILike để không phân biệt hoa thường
            q = q.Where(u =>
                EF.Functions.ILike(u.Email, $"%{s}%") ||
                EF.Functions.ILike(u.FullName!, $"%{s}%"));
        }

        if (roleId.HasValue) q = q.Where(u => u.RoleId == roleId);
        if (statusId.HasValue) q = q.Where(u => u.UserStatusId == statusId);

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderBy(u => u.UserId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserResponse
            {
                UserId = u.UserId,
                RoleId = u.RoleId,
                UserStatusId = u.UserStatusId,
                AddressId = u.AddressId,
                FullName = u.FullName,
                Gender = u.Gender,
                Email = u.Email,
                isProfileComplete = u.IsProfileComplete,
                ProviderLogin = u.ProviderLogin,
                IsDeleted = u.IsDeleted ?? false,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync(ct);

        return Ok(new PagedResult<UserResponse>(items, total, page, pageSize));
    }

    // GET /user/{userId}
    [HttpGet("{userId:int}")]
    public async Task<ActionResult<UserResponse>> GetUser(int userId, CancellationToken ct = default)
    {
        var u = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);

        if (u is null) return NotFound();

        return Ok(new UserResponse
        {
            UserId = u.UserId,
            RoleId = u.RoleId,
            UserStatusId = u.UserStatusId,
            AddressId = u.AddressId,
            FullName = u.FullName,
            Gender = u.Gender,
            Email = u.Email,
            ProviderLogin = u.ProviderLogin,
            IsDeleted = u.IsDeleted ?? false,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt
        });
    }

    // POST /user  (đăng ký tài khoản mới)
    [HttpPost]
    public async Task<ActionResult<UserResponse>> Register(
        [FromBody] UserCreateRequest req,
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
            UserStatusId = req.UserStatusId,
            FullName = req.FullName,
            Gender = req.Gender,
            Email = req.Email,
            PasswordHash = hashed,
            ProviderLogin = req.ProviderLogin,
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

        return CreatedAtAction(nameof(GetUser), new { userId = resp.UserId }, resp);
    }

    // PUT /user/{userId}
    [HttpPut("{userId:int}")]
    public async Task<ActionResult<UserResponse>> UpdateUser(
        int userId,
        [FromBody] UserUpdateRequest req,
        CancellationToken ct = default)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (u is null) return NotFound();

        // Nếu cho phép đổi email, kiểm tra trùng

        u.RoleId = req.RoleId;
      
        u.AddressId = req.AddressId;
        u.FullName = req.FullName;
        u.Gender = req.Gender;
  

        if (!string.IsNullOrWhiteSpace(req.NewPassword))
        {
            // var newHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            var newHash = req.NewPassword; // TODO: thay bằng hash thật sự
            u.PasswordHash = newHash;
        }

      

        u.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync(ct);

        var resp = new UserResponse
        {
            UserId = u.UserId,
            RoleId = u.RoleId,
            UserStatusId = u.UserStatusId,
            AddressId = u.AddressId,
            FullName = u.FullName,
            Gender = u.Gender,
            Email = u.Email,
            ProviderLogin = u.ProviderLogin,
            IsDeleted = u.IsDeleted ?? false,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt
        };

        return Ok(resp);
    }

    // DELETE /user/{userId}  (xoá mềm)
    [HttpDelete("{userId:int}")]
    public async Task<IActionResult> SoftDelete(int userId, CancellationToken ct = default)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (u is null) return NotFound();

        if (u.IsDeleted == true) return NoContent();

        u.IsDeleted = true;
        u.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    //Cap nhat nguoi dung by Admin

}
