using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace BE.Filters;

// Action Filter kiểm tra Policy Accept trước mỗi request
// Nếu user chưa xác nhận đủ policy bắt buộc → trả về POLICY_REQUIRED
public class PolicyAcceptFilter : IAsyncActionFilter
{
    private readonly IPolicyService _policyService;

    public PolicyAcceptFilter(IPolicyService policyService)
    {
        _policyService = policyService;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Bỏ qua nếu không có user đăng nhập
        if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
        {
            await next();
            return;
        }

        // Lấy UserId từ claims
        var userIdClaim = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            await next();
            return;
        }

        // Kiểm tra trạng thái policy
        var policyStatus = await _policyService.CheckPolicyStatusAsync(userId);

        if (!policyStatus.IsCompliant)
        {
            // Trả về lỗi POLICY_REQUIRED với danh sách policy cần xác nhận
            var errorResponse = new PolicyRequiredErrorResponse
            {
                ErrorCode = "POLICY_REQUIRED",
                Message = policyStatus.Message,
                PendingPolicies = policyStatus.PendingPolicies
            };

            context.Result = new ObjectResult(errorResponse)
            {
                StatusCode = 403 // Forbidden
            };
            return;
        }

        await next();
    }
}

// Attribute để đánh dấu các API cần kiểm tra Policy Accept
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequirePolicyAcceptAttribute : TypeFilterAttribute
{
    public RequirePolicyAcceptAttribute() : base(typeof(PolicyAcceptFilter))
    {
    }
}

// Attribute để bỏ qua kiểm tra Policy Accept cho endpoint cụ thể
// Sử dụng cho các API: lấy danh sách policy, xác nhận policy, logout
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class SkipPolicyAcceptAttribute : Attribute
{
}

// Global filter kiểm tra Policy Accept cho tất cả API
// Tự động bỏ qua các endpoint được đánh dấu SkipPolicyAccept
public class GlobalPolicyAcceptFilter : IAsyncActionFilter
{
    private readonly IPolicyService _policyService;
    private readonly ILogger<GlobalPolicyAcceptFilter> _logger;

    // Danh sách các endpoint được phép bỏ qua kiểm tra policy
    private static readonly HashSet<string> AllowedEndpoints = new(StringComparer.OrdinalIgnoreCase)
    {
        // Auth endpoints
        "/api/login",
        "/api/refresh",
        "/api/logout",
        
        // Policy endpoints - cho phép user xem và xác nhận policy
        "/api/policies/status",
        "/api/policies/pending",
        "/api/policies/accept",
        "/api/policies/accept-all",
        "/api/policies/active",
        "/api/policies/history",
        
        // Policy admin endpoints - Admin quản lý policy
        "/api/policies/admin",
        "/api/policies/admin/stats",
        
        // OTP endpoints
        "/api/otp",
        "/api/verify-otp"
    };

    // Các path prefix được phép bỏ qua
    private static readonly string[] AllowedPrefixes = new[]
    {
        "/api/policies/active/",  // GET /api/policies/active/{policyCode}
        "/api/policies/admin/",   // All admin policy endpoints
        "/swagger",
        "/health"
    };

    public GlobalPolicyAcceptFilter(IPolicyService policyService, ILogger<GlobalPolicyAcceptFilter> logger)
    {
        _policyService = policyService;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Bỏ qua nếu có SkipPolicyAcceptAttribute
        if (context.ActionDescriptor.EndpointMetadata.Any(m => m is SkipPolicyAcceptAttribute))
        {
            await next();
            return;
        }

        // Bỏ qua nếu không có user đăng nhập
        if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
        {
            await next();
            return;
        }

        // Kiểm tra endpoint có trong danh sách được phép không
        var path = context.HttpContext.Request.Path.Value?.ToLower() ?? "";
        
        if (AllowedEndpoints.Contains(path) || AllowedPrefixes.Any(prefix => path.StartsWith(prefix.ToLower())))
        {
            await next();
            return;
        }

        // Kiểm tra role của user - Expert và Admin không cần xác nhận Policy
        var userRole = context.HttpContext.User.FindFirstValue(ClaimTypes.Role);
        if (userRole == "Expert" || userRole == "Admin")
        {
            await next();
            return;
        }

        // Lấy UserId từ claims
        var userIdClaim = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            await next();
            return;
        }

        try
        {
            // Kiểm tra trạng thái policy
            var policyStatus = await _policyService.CheckPolicyStatusAsync(userId);

            if (!policyStatus.IsCompliant)
            {
                _logger.LogWarning("User {UserId} bị chặn do chưa xác nhận policy. Path: {Path}", userId, path);

                // Trả về lỗi POLICY_REQUIRED với danh sách policy cần xác nhận
                var errorResponse = new PolicyRequiredErrorResponse
                {
                    ErrorCode = "POLICY_REQUIRED",
                    Message = policyStatus.Message,
                    PendingPolicies = policyStatus.PendingPolicies
                };

                context.Result = new ObjectResult(errorResponse)
                {
                    StatusCode = 403 // Forbidden
                };
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi kiểm tra policy accept cho user {UserId}", userId);
            // Nếu có lỗi, cho phép request tiếp tục để không block hoàn toàn
        }

        await next();
    }
}

