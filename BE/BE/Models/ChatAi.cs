using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ChatAi
{
    public Guid ChatAiId { get; set; }

    public Guid? UserId { get; set; }

    public string? Title { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatAiContent> ChatAiContents { get; set; } = new List<ChatAiContent>();

    public virtual ICollection<ExpertConfirmation> ExpertConfirmations { get; set; } = new List<ExpertConfirmation>();

    public virtual User? User { get; set; }
}
