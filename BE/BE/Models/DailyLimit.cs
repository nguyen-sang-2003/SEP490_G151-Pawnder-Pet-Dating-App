using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class DailyLimit
{
    public int LimitId { get; set; }

    public int UserId { get; set; }

    public string ActionType { get; set; } = null!;

    public DateOnly ActionDate { get; set; }

    public int? Count { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
