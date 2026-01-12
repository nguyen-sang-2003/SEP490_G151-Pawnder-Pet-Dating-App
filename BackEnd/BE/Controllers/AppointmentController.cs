using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BE.Controllers;

/// <summary>
/// Controller cho tính năng hẹn gặp thú cưng (Pet Date Scheduling)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
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

    #region Appointment CRUD

    /// <summary>
    /// Tạo cuộc hẹn mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> CreateAppointment(
        [FromBody] CreateAppointmentRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });
            
            var result = await _appointmentService.CreateAppointmentAsync(userId, request, ct);
            return Ok(new { message = "Tạo cuộc hẹn thành công", data = result });
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
            return StatusCode(500, new { message = "Lỗi khi tạo cuộc hẹn", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thông tin cuộc hẹn theo ID
    /// </summary>
    [HttpGet("{appointmentId}")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> GetAppointmentById(int appointmentId, CancellationToken ct = default)
    {
        try
        {
            var result = await _appointmentService.GetAppointmentByIdAsync(appointmentId, ct);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy cuộc hẹn" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin cuộc hẹn", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách cuộc hẹn theo Match
    /// </summary>
    [HttpGet("by-match/{matchId}")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> GetAppointmentsByMatch(int matchId, CancellationToken ct = default)
    {
        try
        {
            var result = await _appointmentService.GetAppointmentsByMatchIdAsync(matchId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách cuộc hẹn", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách cuộc hẹn của user (tất cả appointments user tham gia)
    /// </summary>
    [HttpGet("my-appointments")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> GetMyAppointments(CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });
            
            var result = await _appointmentService.GetAppointmentsByUserIdAsync(userId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách cuộc hẹn", error = ex.Message });
        }
    }

    #endregion

    #region Appointment Actions

    /// <summary>
    /// Phản hồi cuộc hẹn (Accept/Decline)
    /// </summary>
    [HttpPut("{appointmentId}/respond")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> RespondToAppointment(
        int appointmentId,
        [FromBody] RespondAppointmentRequest request,
        CancellationToken ct = default)
    {
        try
        {
            request.AppointmentId = appointmentId;
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });
            
            var result = await _appointmentService.RespondToAppointmentAsync(userId, request, ct);
            
            var action = request.Accept ? "chấp nhận" : "từ chối";
            return Ok(new { message = $"Đã {action} cuộc hẹn", data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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
            return StatusCode(500, new { message = "Lỗi khi phản hồi cuộc hẹn", error = ex.Message });
        }
    }

    /// <summary>
    /// Đề xuất lại cuộc hẹn (Counter-Offer)
    /// </summary>
    [HttpPut("{appointmentId}/counter-offer")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> CounterOffer(
        int appointmentId,
        [FromBody] CounterOfferRequest request,
        CancellationToken ct = default)
    {
        try
        {
            request.AppointmentId = appointmentId;
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });
            
            var result = await _appointmentService.CounterOfferAsync(userId, request, ct);
            return Ok(new { message = "Đã gửi đề xuất mới", data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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
            return StatusCode(500, new { message = "Lỗi khi đề xuất lại cuộc hẹn", error = ex.Message });
        }
    }

    /// <summary>
    /// Hủy cuộc hẹn
    /// </summary>
    [HttpPut("{appointmentId}/cancel")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> CancelAppointment(
        int appointmentId,
        [FromBody] CancelAppointmentRequest request,
        CancellationToken ct = default)
    {
        try
        {
            request.AppointmentId = appointmentId;
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });
            
            var result = await _appointmentService.CancelAppointmentAsync(userId, request, ct);
            return Ok(new { message = "Đã hủy cuộc hẹn", data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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
            return StatusCode(500, new { message = "Lỗi khi hủy cuộc hẹn", error = ex.Message });
        }
    }

    /// <summary>
    /// Check-in tại địa điểm hẹn (bằng GPS)
    /// </summary>
    [HttpPost("{appointmentId}/check-in")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> CheckIn(
        int appointmentId,
        [FromBody] CheckInRequest request,
        CancellationToken ct = default)
    {
        try
        {
            request.AppointmentId = appointmentId;
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });
            
            var result = await _appointmentService.CheckInAsync(userId, request, ct);
            return Ok(new { message = "Check-in thành công!", data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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
            return StatusCode(500, new { message = "Lỗi khi check-in", error = ex.Message });
        }
    }

    /// <summary>
    /// Kết thúc cuộc hẹn (user bấm thủ công)
    /// </summary>
    [HttpPut("{appointmentId}/complete")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> CompleteAppointment(
        int appointmentId,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });
            
            var result = await _appointmentService.CompleteAppointmentAsync(userId, appointmentId, ct);
            return Ok(new { message = "Cuộc hẹn đã hoàn thành!", data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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
            return StatusCode(500, new { message = "Lỗi khi kết thúc cuộc hẹn", error = ex.Message });
        }
    }

    #endregion

    #region Location

    /// <summary>
    /// Lấy danh sách địa điểm gần đây của user (từ các cuộc hẹn đã tạo)
    /// </summary>
    [HttpGet("my-locations")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> GetMyRecentLocations(
        [FromQuery] int limit = 10,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == 0)
                return Unauthorized(new { message = "Vui lòng đăng nhập" });

            var result = await _appointmentService.GetRecentLocationsAsync(userId, limit, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách địa điểm", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo địa điểm mới
    /// </summary>
    [HttpPost("locations")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> CreateLocation(
        [FromBody] CreateLocationRequest request,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _appointmentService.CreateLocationAsync(request, ct);
            return Ok(new { message = "Tạo địa điểm thành công", data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi tạo địa điểm", error = ex.Message });
        }
    }

    /// <summary>
    /// Kiểm tra điều kiện tiên quyết trước khi tạo cuộc hẹn
    /// </summary>
    [HttpGet("validate-preconditions")]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> ValidatePreconditions(
        [FromQuery] int matchId,
        [FromQuery] int inviterPetId,
        [FromQuery] int inviteePetId,
        CancellationToken ct = default)
    {
        try
        {
            var (isValid, errorMessage) = await _appointmentService.ValidatePreConditionsAsync(
                matchId, inviterPetId, inviteePetId, ct);
            
            return Ok(new { isValid, message = errorMessage ?? "Đủ điều kiện tạo cuộc hẹn" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi kiểm tra điều kiện", error = ex.Message });
        }
    }

    #endregion
}
