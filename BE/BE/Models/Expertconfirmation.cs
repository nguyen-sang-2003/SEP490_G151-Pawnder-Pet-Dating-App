using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ExpertConfirmation
{
    public Guid ExpertId { get; set; }

    public Guid UserId { get; set; }

    public Guid ChatAiId { get; set; }

    public string? Status { get; set; }

    public string? Message { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ChatAi ChatAi { get; set; } = null!;

    public virtual User Expert { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
