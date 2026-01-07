using System;

namespace BE.Models;

// Bảng lưu lịch sử xác nhận Policy của User
// Mỗi lần user xác nhận policy phải lưu:
// - UserId, PolicyVersionId, Thời gian xác nhận
// Không cho phép chỉnh sửa hoặc xóa lịch sử xác nhận (Audit)
public partial class UserPolicyAccept
{
    public long AcceptId { get; set; }

    // FK đến User
    public int UserId { get; set; }

    // FK đến PolicyVersion
    public int PolicyVersionId { get; set; }

    // Thời điểm user xác nhận
    public DateTime AcceptedAt { get; set; }

    // Có còn hiệu lực không (false khi policy đổi version mới)
    public bool IsValid { get; set; } = true;

    // Ngày accept này bị vô hiệu (khi có version mới)
    public DateTime? InvalidatedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    // Navigation property đến User
    public virtual User User { get; set; } = null!;

    // Navigation property đến PolicyVersion
    public virtual PolicyVersion PolicyVersion { get; set; } = null!;
}

