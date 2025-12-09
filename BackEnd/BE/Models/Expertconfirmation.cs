using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ExpertConfirmation
{
    public int ExpertId { get; set; }

    public int UserId { get; set; }

    public int ChatAiid { get; set; }

    public string? Status { get; set; }

    public string? Message { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UserQuestion { get; set; }

    public virtual ChatAi ChatAi { get; set; } = null!;

    public virtual ICollection<ChatExpertContent> ChatExpertContents { get; set; } = new List<ChatExpertContent>();

    public virtual User Expert { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
