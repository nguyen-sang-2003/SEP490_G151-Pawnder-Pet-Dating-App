using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ChatExpert
{
    public int ChatExpertId { get; set; }

    public int? ExpertId { get; set; }

    public int? UserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatExpertContent> ChatExpertContents { get; set; } = new List<ChatExpertContent>();

    public virtual User? Expert { get; set; }

    public virtual User? User { get; set; }
}
