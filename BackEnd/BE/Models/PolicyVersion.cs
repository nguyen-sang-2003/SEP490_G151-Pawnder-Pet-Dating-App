using System;
using System.Collections.Generic;

namespace BE.Models;

// Bảng lưu các phiên bản của Policy
// Mỗi lần chỉnh sửa nội dung → tăng Version
// Chỉ 01 version được Active tại một thời điểm cho mỗi Policy
public partial class PolicyVersion
{
    public int PolicyVersionId { get; set; }

    // FK đến Policy
    public int PolicyId { get; set; }

    // Số version (1, 2, 3...)
    public int VersionNumber { get; set; }

    // Tiêu đề của version này
    public string Title { get; set; } = null!;

    // Nội dung đầy đủ của Policy (HTML hoặc Markdown)
    public string Content { get; set; } = null!;

    // Tóm tắt những thay đổi so với version trước (changelog)
    public string? ChangeLog { get; set; }

    // Trạng thái: DRAFT, ACTIVE, INACTIVE
    // - DRAFT: Admin tạo, chỉnh sửa, chưa phát hành
    // - ACTIVE: Đã phát hành, có hiệu lực
    // - INACTIVE: Hết hiệu lực
    public string Status { get; set; } = "DRAFT";

    // Ngày publish (khi chuyển sang ACTIVE)
    public DateTime? PublishedAt { get; set; }

    // Ngày hết hiệu lực (khi chuyển sang INACTIVE)
    public DateTime? DeactivatedAt { get; set; }

    // Người tạo version này (Admin)
    public int? CreatedByUserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation property đến Policy
    public virtual Policy Policy { get; set; } = null!;

    // Navigation property đến User (Admin đã tạo)
    public virtual User? CreatedByUser { get; set; }

    // Danh sách các accept của user cho version này
    public virtual ICollection<UserPolicyAccept> UserPolicyAccepts { get; set; } = new List<UserPolicyAccept>();
}
