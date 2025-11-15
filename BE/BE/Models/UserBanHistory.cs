using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class UserBanHistory
{
    public int BanId { get; set; }

    public int UserId { get; set; }

    public DateTime BanStart { get; set; }

    public DateTime? BanEnd { get; set; }

    public string? BanReason { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? IsActive { get; set; }

    public virtual User User { get; set; } = null!;
}
