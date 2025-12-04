using System.Net.Mime;
using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers;

/// <summary>
/// Controller cho User - chỉ nhận request và trả response
/// </summary>
[ApiController]
[Route("user")]
[Produces(MediaTypeNames.Application.Json)]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    // GET /user?search=&roleId=&statusId=&page=1&pageSize=20&includeDeleted=false
    [HttpGet]
    [Authorize(Roles = "Admin,Expert,User")]
    public async Task<ActionResult<PagedResult<UserResponse>>> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int? roleId,
        [FromQuery] int? statusId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool includeDeleted = false,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _userService.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // GET /user/{userId}
    [HttpGet("{userId:int}")]
    [Authorize(Roles = "User,Expert,Admin")]
    public async Task<ActionResult<UserResponse>> GetUser(int userId, CancellationToken ct = default)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(userId, ct);
            
            if (user == null)
                return NotFound();

            // Debug: Log isProfileComplete value
            Console.WriteLine($"[GetUser] UserId={userId}, isProfileComplete={user.isProfileComplete}");

            return Ok(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // POST /user (đăng ký tài khoản mới)
    [HttpPost]
    public async Task<ActionResult<UserResponse>> Register(
        [FromBody] UserCreateRequest req,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _userService.RegisterAsync(req, ct);
            return CreatedAtAction(nameof(GetUser), new { userId = result.UserId }, result);
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

    // PUT /user/{userId}
    [HttpPut("{userId:int}")]
    [Authorize(Roles = "User,Expert,Admin")]
    public async Task<ActionResult<UserResponse>> UpdateUser(
        int userId,
        [FromBody] UserUpdateRequest req,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _userService.UpdateUserAsync(userId, req, ct);
            return Ok(result);
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

    // DELETE /user/{userId} (xoá mềm)
    [HttpDelete("{userId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SoftDelete(int userId, CancellationToken ct = default)
    {
        try
        {
            var success = await _userService.SoftDeleteUserAsync(userId, ct);
            
            if (!success)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // PATCH /user/{id}/complete-profile
    [HttpPatch("{id:int}/complete-profile")]
    [Authorize(Roles = "User")]
    public async Task<ActionResult> CompleteProfile(int id, CancellationToken ct = default)
    {
        try
        {
            var success = await _userService.CompleteProfileAsync(id, ct);
            
            if (!success)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            return Ok(new { 
                message = "Đã hoàn thành hồ sơ.",
                isProfileComplete = true
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi: {ex.Message}" });
        }
    }

    // PUT /user/reset-password
    [HttpPut("reset-password")]
    public async Task<ActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request, 
        CancellationToken ct = default)
    {
        try
        {
            var success = await _userService.ResetPasswordAsync(request, ct);
            
            return Ok(new { message = "Đặt lại mật khẩu thành công." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi: {ex.Message}" });
        }
    }
}

