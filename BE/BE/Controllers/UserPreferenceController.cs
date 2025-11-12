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
            .Include(up => up.Option)
            .OrderBy(up => up.AttributeId)
            .Select(up => new UserPreferenceResponse
            {
                AttributeId = up.AttributeId,
                AttributeName = up.Attribute.Name!,
                TypeValue = up.Attribute.TypeValue,
                Unit = up.Attribute.Unit,
                OptionId = up.OptionId,
                OptionName = up.Option != null ? up.Option.Name : null,
                MaxValue = up.MaxValue,
                MinValue = up.MinValue,
                CreatedAt = up.CreatedAt,
                UpdatedAt = up.UpdatedAt
            })
            .ToListAsync(ct);

        return Ok(new { message = "Lấy sở thích thành công.", data = items });
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

    // DELETE /user-preference/{userId}
    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUserPreferences(int userId)
    {
        var preferences = await _db.UserPreferences
            .Where(p => p.UserId == userId)
            .ToListAsync();

        if (preferences == null || preferences.Count == 0)
            return NotFound("Người dùng không có sở thích nào để xóa.");

        _db.UserPreferences.RemoveRange(preferences);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            Message = $"Đã xóa {preferences.Count} sở thích của người dùng {userId}."
        });
    }

    // POST /user-preference/{userId}/batch
    // Lưu hoặc cập nhật nhiều preferences cùng lúc
    [HttpPost("{userId:int}/batch")]
    public async Task<IActionResult> UpsertBatch(
        int userId,
        [FromBody] UserPreferenceBatchUpsertRequest request,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        // Kiểm tra user tồn tại
        var userExists = await _db.Users
            .AnyAsync(u => u.UserId == userId && (u.IsDeleted == null || u.IsDeleted == false), ct);
        if (!userExists)
            return NotFound(new { message = "User không tồn tại." });

        // Validate tất cả attributes tồn tại
        var attributeIds = request.Preferences.Select(p => p.AttributeId).Distinct().ToList();
        var validAttributes = await _db.Attributes
            .Where(a => attributeIds.Contains(a.AttributeId) && a.IsDeleted == false)
            .Select(a => a.AttributeId)
            .ToListAsync(ct);

        if (validAttributes.Count != attributeIds.Count)
            return BadRequest(new { message = "Có attribute không hợp lệ hoặc đã bị xóa." });

        // Lấy tất cả preferences hiện tại của user
        var existingPreferences = await _db.UserPreferences
            .Where(up => up.UserId == userId)
            .ToListAsync(ct);

        // Nếu request.Preferences rỗng, xóa hết preferences cũ
        if (request.Preferences == null || request.Preferences.Count == 0)
        {
            if (existingPreferences.Count > 0)
            {
                _db.UserPreferences.RemoveRange(existingPreferences);
                await _db.SaveChangesAsync(ct);
                return Ok(new
                {
                    message = $"Đã xóa tất cả {existingPreferences.Count} sở thích.",
                    created = 0,
                    updated = 0,
                    deleted = existingPreferences.Count
                });
            }
            return Ok(new
            {
                message = "Không có sở thích nào để xóa.",
                created = 0,
                updated = 0,
                deleted = 0
            });
        }

        var now = DateTime.Now;
        var created = 0;
        var updated = 0;

        // Get list of attributeIds in the request
        var requestAttributeIds = request.Preferences.Select(p => p.AttributeId).ToHashSet();

        // Delete preferences that are not in the request
        var prefsToDelete = existingPreferences.Where(ep => !requestAttributeIds.Contains(ep.AttributeId)).ToList();
        if (prefsToDelete.Count > 0)
        {
            _db.UserPreferences.RemoveRange(prefsToDelete);
        }

        foreach (var pref in request.Preferences)
        {
            var existing = existingPreferences.FirstOrDefault(ep => ep.AttributeId == pref.AttributeId);

            if (existing != null)
            {
                // Update existing
                existing.OptionId = pref.OptionId;
                existing.MinValue = pref.MinValue;
                existing.MaxValue = pref.MaxValue;
                existing.UpdatedAt = now;
                updated++;
            }
            else
            {
                // Create new
                var newPref = new UserPreference
                {
                    UserId = userId,
                    AttributeId = pref.AttributeId,
                    OptionId = pref.OptionId,
                    MinValue = pref.MinValue,
                    MaxValue = pref.MaxValue,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.UserPreferences.Add(newPref);
                created++;
            }
        }

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = $"Lưu sở thích thành công. Tạo mới: {created}, Cập nhật: {updated}, Xóa: {prefsToDelete.Count}",
            created,
            updated,
            deleted = prefsToDelete.Count
        });
    }
}
