using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BE.Controllers;

/// <summary>
/// Controller cho tính năng Sự kiện Online (Cuộc thi ảnh/video)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class EventController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventController(IEventService eventService)
    {
        _eventService = eventService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return 0;
    }

    #region Admin Endpoints

    /// <summary>
    /// Tạo sự kiện mới (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateEvent(
        [FromBody] CreateEventRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var adminId = GetCurrentUserId();
            if (adminId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });

            var result = await _eventService.CreateEventAsync(adminId, request, ct);
            return Ok(new { message = "Tạo sự kiện thành công", data = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tạo sự kiện", error = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật sự kiện (Admin only)
    /// </summary>
    [HttpPut("{eventId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateEvent(
        int eventId,
        [FromBody] UpdateEventRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _eventService.UpdateEventAsync(eventId, request, ct);
            return Ok(new { message = "Cập nhật sự kiện thành công", data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi cập nhật sự kiện", error = ex.Message });
        }
    }

    /// <summary>
    /// Hủy sự kiện (Admin only)
    /// </summary>
    [HttpPut("{eventId}/cancel")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CancelEvent(
        int eventId,
        [FromBody] CancelEventRequest? request,
        CancellationToken ct = default)
    {
        try
        {
            await _eventService.CancelEventAsync(eventId, request?.Reason, ct);
            return Ok(new { message = "Đã hủy sự kiện" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi hủy sự kiện", error = ex.Message });
        }
    }

    #endregion

    #region User Endpoints

    /// <summary>
    /// Lấy danh sách sự kiện đang hoạt động
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveEvents(CancellationToken ct = default)
    {
        try
        {
            var result = await _eventService.GetActiveEventsAsync(ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách sự kiện", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết sự kiện
    /// </summary>
    [HttpGet("{eventId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEventById(int eventId, CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _eventService.GetEventByIdAsync(eventId, userId > 0 ? userId : null, ct);
            
            if (result == null)
                return NotFound(new { message = "Không tìm thấy sự kiện" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin sự kiện", error = ex.Message });
        }
    }

    /// <summary>
    /// Đăng bài dự thi
    /// </summary>
    [HttpPost("{eventId}/submit")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> SubmitEntry(
        int eventId,
        [FromBody] SubmitEntryRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });

            request.EventId = eventId;
            var result = await _eventService.SubmitEntryAsync(userId, request, ct);
            return Ok(new { message = "Đăng bài dự thi thành công!", data = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi đăng bài dự thi", error = ex.Message });
        }
    }

    /// <summary>
    /// Vote cho bài dự thi
    /// </summary>
    [HttpPost("submission/{submissionId}/vote")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> Vote(int submissionId, CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });

            await _eventService.VoteAsync(userId, submissionId, ct);
            return Ok(new { message = "Đã vote thành công!" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi vote", error = ex.Message });
        }
    }

    /// <summary>
    /// Bỏ vote
    /// </summary>
    [HttpDelete("submission/{submissionId}/vote")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> Unvote(int submissionId, CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });

            await _eventService.UnvoteAsync(userId, submissionId, ct);
            return Ok(new { message = "Đã bỏ vote" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi bỏ vote", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy bảng xếp hạng
    /// </summary>
    [HttpGet("{eventId}/leaderboard")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLeaderboard(int eventId, CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _eventService.GetLeaderboardAsync(eventId, userId > 0 ? userId : null, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy bảng xếp hạng", error = ex.Message });
        }
    }

    #endregion
}

/// <summary>
/// Request để hủy sự kiện
/// </summary>
public class CancelEventRequest
{
    public string? Reason { get; set; }
}
