using System.Net.Mime;
using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers;

[ApiController]
[Route("user-preference")]
[Produces(MediaTypeNames.Application.Json)]
public class UserPreferenceController : ControllerBase
{
    private readonly PawnderDatabaseContext _db;

    public UserPreferenceController(PawnderDatabaseContext db)
    {
        _db = db;
    }

    // GET /user-preference/{userId}
    // Lấy tất cả sở thích (preferences) của 1 user
    [HttpGet("{userId:int}")]
    public async Task<ActionResult<IEnumerable<UserPreferenceResponse>>> GetAllByUser(
        int userId,
        CancellationToken ct = default)
    {
        // Kiểm tra user tồn tại (và không bị xoá mềm nếu bạn dùng IsDeleted)
        var userExists = await _db.Users
            .AnyAsync(u => u.UserId == userId && (u.IsDeleted == null || u.IsDeleted == false), ct);

        if (!userExists)
            return NotFound(new { message = "User not found." });

        var items = await _db.UserPreferences
            .AsNoTracking()
            .Where(up => up.UserId == userId)
            .Include(up => up.Attribute)
            .OrderBy(up => up.AttributeId)
            .Select(up => new UserPreferenceResponse
            {
                AttributeId = up.AttributeId,
                AttributeName = up.Attribute.Name!,
                TypeValue = up.Attribute.TypeValue,
                Unit = up.Attribute.Unit,
                
                CreatedAt = up.CreatedAt,
                UpdatedAt = up.UpdatedAt
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    // POST /user-preference/{userId}/{attributeId}
    // Tạo mới 1 preference (UserId, AttributeId là composite key)
    [HttpPost("{userId:int}/{attributeId:int}")]
    public async Task<IActionResult> Create(
        int userId,
        int attributeId,
        [FromBody] UserPreferenceUpsertRequest req,
        CancellationToken ct = default)
    {
        // Validate user
        var userExists = await _db.Users
            .AnyAsync(u => u.UserId == userId && (u.IsDeleted == null || u.IsDeleted == false), ct);
        if (!userExists)
            return NotFound(new { message = "User not found." });

        // Validate attribute
        var attribute = await _db.Attributes
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AttributeId == attributeId && a.IsDeleted == false, ct);
        if (attribute is null)
            return NotFound(new { message = "Attribute not found." });

        // Check duplicate (composite key)
        var exists = await _db.UserPreferences
            .AnyAsync(up => up.UserId == userId && up.AttributeId == attributeId, ct);
        if (exists)
            return Conflict(new { message = "User preference already exists for this attribute." });

        var entity = new UserPreference
        {
            UserId = userId,
            AttributeId = attributeId,
          
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.UserPreferences.Add(entity);
        await _db.SaveChangesAsync(ct);

        // Trả về 201 + Location header (trỏ về GET danh sách của user)
        return CreatedAtAction(nameof(GetAllByUser), new { userId }, new
        {
            userId,
            attributeId,
           
        });
    }

    // PUT /user-preference/{userId}/{attributeId}
    // Cập nhật giá trị preference hiện có
    [HttpPut("{userId:int}/{attributeId:int}")]
    public async Task<ActionResult<UserPreferenceResponse>> Update(
        int userId,
        int attributeId,
        [FromBody] UserPreferenceUpsertRequest req,
        CancellationToken ct = default)
    {
        // Tìm entity theo composite key
        var entity = await _db.UserPreferences
            .Include(up => up.Attribute)
            .FirstOrDefaultAsync(up => up.UserId == userId && up.AttributeId == attributeId, ct);

        if (entity is null)
            return NotFound(new { message = "User preference not found." });

    
        entity.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync(ct);

        var resp = new UserPreferenceResponse
        {
            AttributeId = entity.AttributeId,
            AttributeName = entity.Attribute.Name!,
            TypeValue = entity.Attribute.TypeValue,
            Unit = entity.Attribute.Unit,
           
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };

        return Ok(resp);
    }
}
