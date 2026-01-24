using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Notification
{
    public int NotificationId { get; set; }

    public int? UserId { get; set; }

    public string? Title { get; set; }

    public string? Message { get; set; }

    public string? Type { get; set; }

    /// <summary>
    /// Status: DRAFT (chưa gửi), SENT (đã gửi)
    /// </summary>
    public string Status { get; set; } = "SENT";

    /// <summary>
    /// If true, this notification is sent to all users
    /// </summary>
    public bool IsBroadcast { get; set; } = false;

    public bool IsRead { get; set; } = false;

    /// <summary>
    /// Reference ID for related entity (e.g., ExpertId for expert confirmations)
    /// </summary>
    public int? ReferenceId { get; set; }

    /// <summary>
    /// Timestamp when notification was sent (for broadcast)
    /// </summary>
    public DateTime? SentAt { get; set; }

    /// <summary>
    /// Admin who created this notification (for broadcast)
    /// </summary>
    public int? CreatedByUserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? User { get; set; }

    public virtual User? CreatedByUser { get; set; }
}
