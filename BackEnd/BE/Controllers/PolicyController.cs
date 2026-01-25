using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BE.Controllers;

// Controller quản lý Chính sách (Policy)
// - Admin: CRUD Policy, Version, Publish, Thống kê
// - User: Xem, Xác nhận Policy
[ApiController]
[Route("api/policies")]
public class PolicyController : ControllerBase
{
    private readonly IPolicyService _policyService;

    public PolicyController(IPolicyService policyService)
    {
        _policyService = policyService;
    }

    // Lấy danh sách tất cả Policy (Admin)
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<PolicyResponse>>> GetAllPolicies(CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.GetAllPoliciesAsync(ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Lấy chi tiết Policy theo ID (Admin)
    [HttpGet("admin/{policyId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PolicyResponse>> GetPolicyById(int policyId, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.GetPolicyByIdAsync(policyId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Tạo Policy mới (Admin)
    [HttpPost("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PolicyResponse>> CreatePolicy([FromBody] CreatePolicyRequest request, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.CreatePolicyAsync(request, ct);
            return CreatedAtAction(nameof(GetPolicyById), new { policyId = result.PolicyId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Cập nhật Policy (Admin)
    [HttpPut("admin/{policyId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PolicyResponse>> UpdatePolicy(int policyId, [FromBody] UpdatePolicyRequest request, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.UpdatePolicyAsync(policyId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Xóa Policy (soft delete) (Admin)
    [HttpDelete("admin/{policyId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeletePolicy(int policyId, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.DeletePolicyAsync(policyId, ct);
            if (!result)
                return NotFound(new { Message = "Không tìm thấy Policy" });
            return Ok(new { Message = "Xóa Policy thành công" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Lấy danh sách Version của Policy (Admin)
    [HttpGet("admin/{policyId}/versions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<PolicyVersionResponse>>> GetVersionsByPolicyId(int policyId, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.GetVersionsByPolicyIdAsync(policyId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Lấy chi tiết Version (Admin)
    [HttpGet("admin/versions/{versionId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PolicyVersionResponse>> GetVersionById(int versionId, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.GetVersionByIdAsync(versionId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Tạo Version mới (DRAFT) (Admin)
    [HttpPost("admin/{policyId}/versions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PolicyVersionResponse>> CreateVersion(int policyId, [FromBody] CreatePolicyVersionRequest request, CancellationToken ct = default)
    {
        try
        {
            var adminUserId = GetCurrentUserId();
            var result = await _policyService.CreateVersionAsync(policyId, request, adminUserId, ct);
            return CreatedAtAction(nameof(GetVersionById), new { versionId = result.PolicyVersionId }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Cập nhật Version (chỉ DRAFT) (Admin)
    [HttpPut("admin/versions/{versionId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PolicyVersionResponse>> UpdateVersion(int versionId, [FromBody] UpdatePolicyVersionRequest request, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.UpdateVersionAsync(versionId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Publish Version (DRAFT -> ACTIVE) (Admin)
    [HttpPost("admin/versions/{versionId}/publish")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PolicyVersionResponse>> PublishVersion(int versionId, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.PublishVersionAsync(versionId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Xóa Version (chỉ DRAFT) (Admin)
    [HttpDelete("admin/versions/{versionId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteVersion(int versionId, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.DeleteVersionAsync(versionId, ct);
            if (!result)
                return BadRequest(new { Message = "Không thể xóa Version (chỉ xóa được DRAFT)" });
            return Ok(new { Message = "Xóa Version thành công" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Lấy thống kê accept của các Policy (Admin)
    [HttpGet("admin/stats")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<PolicyAcceptStatsResponse>>> GetAcceptStats(CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.GetAcceptStatsAsync(ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Lấy tất cả Policy Active (Public - cho User xem)
    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<List<PendingPolicyResponse>>> GetAllActivePolicies(CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.GetAllActivePoliciesAsync(ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Lấy nội dung Policy Active theo code (Public)
    [HttpGet("active/{policyCode}")]
    [AllowAnonymous]
    public async Task<ActionResult<PendingPolicyResponse>> GetActivePolicyContent(string policyCode, CancellationToken ct = default)
    {
        try
        {
            var result = await _policyService.GetActivePolicyContentAsync(policyCode, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Kiểm tra trạng thái Policy của User đang đăng nhập
    [HttpGet("status")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<PolicyStatusResponse>> CheckPolicyStatus(CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _policyService.CheckPolicyStatusAsync(userId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Lấy danh sách Policy cần User xác nhận
    [HttpGet("pending")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<List<PendingPolicyResponse>>> GetPendingPolicies(CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _policyService.GetPendingPoliciesAsync(userId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // User xác nhận một Policy
    [HttpPost("accept")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<PolicyStatusResponse>> AcceptPolicy([FromBody] AcceptPolicyRequest request, CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _policyService.AcceptPolicyAsync(userId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // User xác nhận nhiều Policy cùng lúc
    [HttpPost("accept-all")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<PolicyStatusResponse>> AcceptMultiplePolicies([FromBody] AcceptMultiplePoliciesRequest request, CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _policyService.AcceptMultiplePoliciesAsync(userId, request, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    // Lấy lịch sử accept của User
    [HttpGet("history")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<List<UserAcceptHistoryResponse>>> GetAcceptHistory(CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _policyService.GetUserAcceptHistoryAsync(userId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim))
            throw new UnauthorizedAccessException("Không xác định được người dùng");
        return int.Parse(userIdClaim);
    }
}
