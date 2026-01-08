using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BE.DTO;

// DTO để Admin tạo Policy mới
public class CreatePolicyRequest
{
    [Required(ErrorMessage = "Mã chính sách là bắt buộc")]
    [MaxLength(50, ErrorMessage = "Mã chính sách tối đa 50 ký tự")]
    [RegularExpression(@"^[A-Z_]+$", ErrorMessage = "Mã chính sách chỉ chứa chữ in hoa và dấu gạch dưới")]
    public string PolicyCode { get; set; } = null!;

    [Required(ErrorMessage = "Tên chính sách là bắt buộc")]
    [MaxLength(200, ErrorMessage = "Tên chính sách tối đa 200 ký tự")]
    public string PolicyName { get; set; } = null!;

    public string? Description { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public bool RequireConsent { get; set; } = true;
}

// DTO để Admin cập nhật Policy
public class UpdatePolicyRequest
{
    [MaxLength(200, ErrorMessage = "Tên chính sách tối đa 200 ký tự")]
    public string? PolicyName { get; set; }

    public string? Description { get; set; }

    public int? DisplayOrder { get; set; }

    public bool? RequireConsent { get; set; }

    public bool? IsActive { get; set; }
}

// DTO để Admin tạo Policy Version mới
public class CreatePolicyVersionRequest
{
    [Required(ErrorMessage = "Tiêu đề là bắt buộc")]
    [MaxLength(300, ErrorMessage = "Tiêu đề tối đa 300 ký tự")]
    public string Title { get; set; } = null!;

    [Required(ErrorMessage = "Nội dung là bắt buộc")]
    public string Content { get; set; } = null!;

    public string? ChangeLog { get; set; }
}

// DTO để Admin cập nhật Policy Version (chỉ khi còn DRAFT)
public class UpdatePolicyVersionRequest
{
    [MaxLength(300, ErrorMessage = "Tiêu đề tối đa 300 ký tự")]
    public string? Title { get; set; }

    public string? Content { get; set; }

    public string? ChangeLog { get; set; }
}

// DTO để User xác nhận Policy
public class AcceptPolicyRequest
{
    [Required(ErrorMessage = "Mã chính sách là bắt buộc")]
    public string PolicyCode { get; set; } = null!;

    [Required(ErrorMessage = "Số version là bắt buộc")]
    public int VersionNumber { get; set; }
}

// DTO để User xác nhận nhiều Policy cùng lúc
public class AcceptMultiplePoliciesRequest
{
    [Required(ErrorMessage = "Danh sách chính sách là bắt buộc")]
    [MinLength(1, ErrorMessage = "Cần ít nhất 1 chính sách")]
    public List<AcceptPolicyRequest> Policies { get; set; } = new();
}

// DTO trả về thông tin Policy (cho Admin)
public class PolicyResponse
{
    public int PolicyId { get; set; }
    public string PolicyCode { get; set; } = null!;
    public string PolicyName { get; set; } = null!;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool RequireConsent { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Version đang active (nếu có)
    public PolicyVersionResponse? ActiveVersion { get; set; }
    
    // Tổng số version
    public int TotalVersions { get; set; }
}

// DTO trả về thông tin Policy Version
public class PolicyVersionResponse
{
    public int PolicyVersionId { get; set; }
    public int PolicyId { get; set; }
    public string PolicyCode { get; set; } = null!;
    public int VersionNumber { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? ChangeLog { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? PublishedAt { get; set; }
    public DateTime? DeactivatedAt { get; set; }
    public int? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

// DTO trả về thông tin Policy cần User xác nhận
public class PendingPolicyResponse
{
    public string PolicyCode { get; set; } = null!;
    public string PolicyName { get; set; } = null!;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public int VersionNumber { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? ChangeLog { get; set; }
    public DateTime? PublishedAt { get; set; }
    
    // User đã từng xác nhận version cũ chưa
    public bool HasPreviousAccept { get; set; }
    
    // Version cũ mà user đã xác nhận (nếu có)
    public int? PreviousAcceptVersion { get; set; }
}

// DTO trả về kết quả kiểm tra policy status của user
public class PolicyStatusResponse
{
    // User có đủ điều kiện sử dụng app không
    public bool IsCompliant { get; set; }
    
    // Trạng thái: ACTIVE, PENDING_POLICY
    public string Status { get; set; } = null!;
    
    // Message mô tả
    public string Message { get; set; } = null!;
    
    // Danh sách policy cần xác nhận (nếu chưa đủ)
    public List<PendingPolicyResponse> PendingPolicies { get; set; } = new();
}

// DTO trả về lịch sử accept của user
public class UserAcceptHistoryResponse
{
    public long AcceptId { get; set; }
    public string PolicyCode { get; set; } = null!;
    public string PolicyName { get; set; } = null!;
    public int VersionNumber { get; set; }
    public string VersionTitle { get; set; } = null!;
    public DateTime AcceptedAt { get; set; }
    public bool IsValid { get; set; }
    public DateTime? InvalidatedAt { get; set; }
}

// DTO thống kê accept (cho Admin)
public class PolicyAcceptStatsResponse
{
    public int PolicyId { get; set; }
    public string PolicyCode { get; set; } = null!;
    public string PolicyName { get; set; } = null!;
    public int ActiveVersionNumber { get; set; }
    
    // Tổng số user active trong hệ thống
    public int TotalActiveUsers { get; set; }
    
    // Số user đã xác nhận version hiện tại
    public int AcceptedUsers { get; set; }
    
    // Số user chưa xác nhận
    public int PendingUsers { get; set; }
    
    // Tỷ lệ xác nhận (%)
    public double AcceptRate { get; set; }
}

// Response khi user bị chặn do chưa accept policy
public class PolicyRequiredErrorResponse
{
    public string ErrorCode { get; set; } = "POLICY_REQUIRED";
    public string Message { get; set; } = "Người dùng cần xác nhận điều khoản để tiếp tục sử dụng";
    public List<PendingPolicyResponse> PendingPolicies { get; set; } = new();
}
