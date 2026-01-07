using System;
using System.Collections.Generic;

namespace BE.Models;

// Bảng chính lưu thông tin Policy (Chính sách)
// Ví dụ: TERMS_OF_SERVICE, PRIVACY_POLICY
public partial class Policy
{
    public int PolicyId { get; set; }

    // Mã định danh duy nhất (TERMS_OF_SERVICE, PRIVACY_POLICY)
    public string PolicyCode { get; set; } = null!;

    // Tên hiển thị của Policy
    public string PolicyName { get; set; } = null!;

    // Mô tả ngắn về Policy
    public string? Description { get; set; }

    // Thứ tự hiển thị
    public int DisplayOrder { get; set; } = 0;

    // Policy có yêu cầu user xác nhận không
    public bool RequireConsent { get; set; } = true;

    // Policy có đang active không
    public bool IsActive { get; set; } = true;

    // Soft delete flag
    public bool IsDeleted { get; set; } = false;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Danh sách các version của Policy
    public virtual ICollection<PolicyVersion> PolicyVersions { get; set; } = new List<PolicyVersion>();
}
