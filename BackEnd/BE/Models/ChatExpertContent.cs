using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ChatExpertContent
{
    public int ContentId { get; set; }

    public int? ChatExpertId { get; set; }

    public int? FromId { get; set; }

    public string? Message { get; set; }

    public int? ExpertId { get; set; }

    public int? UserId { get; set; }

    public int? ChatAiid { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ChatExpert? ChatExpert { get; set; }

    public virtual ExpertConfirmation? ExpertConfirmation { get; set; }

    public virtual User? From { get; set; }
}
