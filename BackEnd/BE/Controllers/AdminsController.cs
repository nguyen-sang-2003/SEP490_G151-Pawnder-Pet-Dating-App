using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho Admin - chỉ nhận request và trả response
    /// </summary>
    [Route("admin/users")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminsController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminsController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // POST /admin/users/expert-confirmation/reassign
        [HttpPost("expert-confirmation/reassign")]
        public async Task<ActionResult<ReassignExpertConfirmationResponse>> ReassignExpertConfirmation(
            [FromBody] ReassignExpertConfirmationRequest req,
            CancellationToken ct = default)
        {
            try
            {
                var result = await _adminService.ReassignExpertConfirmationAsync(req, ct);
                return Ok(result);
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
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /admin/users/{id}/ban
        [HttpPost("{id:int}/ban")]
        public async Task<ActionResult> BanUser([FromRoute] int id, [FromBody] BanUserRequest req, CancellationToken ct = default)
        {
            try
            {
                var result = await _adminService.BanUserAsync(id, req, ct);
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
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /admin/users/{id}/unban
        [HttpPost("{id:int}/unban")]
        public async Task<ActionResult> UnbanUser([FromRoute] int id, [FromBody] UnbanUserRequest? req, CancellationToken ct = default)
        {
            try
            {
                var result = await _adminService.UnbanUserAsync(id, req, ct);
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

        // GET /admin/users/{id}/bans
        [HttpGet("{id:int}/bans")]
        public async Task<ActionResult> GetUserBans([FromRoute] int id, CancellationToken ct = default)
        {
            try
            {
                var items = await _adminService.GetUserBansAsync(id, ct);
                return Ok(items);
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

        // PUT /admin/users/{id}
        [HttpPut("{id:int}")]
        public async Task<ActionResult> UpdateUserByAdmin(
            [FromRoute] int id,
            [FromBody] AdUserUpdateRequest request,
            CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            try
            {
                var success = await _adminService.UpdateUserByAdminAsync(id, request, ct);
                return Ok(new { message = "Cập nhật người dùng thành công." });
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

        // POST /admin/users
        [HttpPost]
        public async Task<ActionResult<UserResponse>> Register(
            [FromBody] AdUserCreateRequest req,
            CancellationToken ct = default)
        {
            try
            {
                var resp = await _adminService.RegisterUserByAdminAsync(req, ct);
                return CreatedAtAction(nameof(Register), new { userId = resp.UserId }, resp);
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
    }
}
