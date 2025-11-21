using System.Net.Mime;
using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers;

/// <summary>
/// Controller cho UserPreference - chỉ nhận request và trả response
/// </summary>
[ApiController]
[Route("user-preference")]
[Produces(MediaTypeNames.Application.Json)]
public class UserPreferenceController : ControllerBase
{
    private readonly IUserPreferenceService _userPreferenceService;

    public UserPreferenceController(IUserPreferenceService userPreferenceService)
    {
        _userPreferenceService = userPreferenceService;
    }

    // GET /user-preference/{userId}
    [HttpGet("{userId:int}")]
    [Authorize(Roles = "User")]
    public async Task<ActionResult<IEnumerable<UserPreferenceResponse>>> GetAllByUser(
        int userId,
        CancellationToken ct = default)
    {
        try
        {
            var items = await _userPreferenceService.GetUserPreferencesAsync(userId, ct);
            return Ok(new { message = "Lấy sở thích thành công.", data = items });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // POST /user-preference/{userId}/{attributeId}
    [HttpPost("{userId:int}/{attributeId:int}")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> Create(
        int userId,
        int attributeId,
        [FromBody] UserPreferenceUpsertRequest req,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _userPreferenceService.CreateUserPreferenceAsync(userId, attributeId, req, ct);
            return CreatedAtAction(nameof(GetAllByUser), new { userId }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // PUT /user-preference/{userId}/{attributeId}
    [HttpPut("{userId:int}/{attributeId:int}")]
    [Authorize(Roles = "User")]
    public async Task<ActionResult<UserPreferenceResponse>> Update(
        int userId,
        int attributeId,
        [FromBody] UserPreferenceUpsertRequest req,
        CancellationToken ct = default)
    {
        try
        {
            var resp = await _userPreferenceService.UpdateUserPreferenceAsync(userId, attributeId, req, ct);
            return Ok(resp);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // DELETE /user-preference/{userId}
    [HttpDelete("{userId}")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> DeleteUserPreferences(int userId, CancellationToken ct = default)
    {
        try
        {
            var success = await _userPreferenceService.DeleteUserPreferencesAsync(userId, ct);
            
            if (!success)
                return NotFound("Người dùng không có sở thích nào để xóa.");

            return Ok(new { Message = $"Đã xóa sở thích của người dùng {userId}." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // POST /user-preference/{userId}/batch
    [HttpPost("{userId:int}/batch")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> UpsertBatch(
        int userId,
        [FromBody] UserPreferenceBatchUpsertRequest request,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var result = await _userPreferenceService.UpsertBatchAsync(userId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }
}
