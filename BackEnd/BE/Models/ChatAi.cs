using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ChatAi
{
    public int ChatAiid { get; set; }

    public int? UserId { get; set; }

    public string? Title { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatAicontent> ChatAicontents { get; set; } = new List<ChatAicontent>();

    public virtual ICollection<ExpertConfirmation> ExpertConfirmations { get; set; } = new List<ExpertConfirmation>();

    public virtual User? User { get; set; }
}
