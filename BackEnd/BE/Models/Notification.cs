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

    public bool IsRead { get; set; } = false;

    /// <summary>
    /// Reference ID for related entity (e.g., ExpertId for expert confirmations)
    /// </summary>
    public int? ReferenceId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? User { get; set; }
}
