using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ChatUser
{
    public int MatchId { get; set; }

    public int? FromUserId { get; set; }

    public int? ToUserId { get; set; }

    public string? Status { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatUserContent> ChatUserContents { get; set; } = new List<ChatUserContent>();

    public virtual User? Fromuser { get; set; }

    public virtual User? Touser { get; set; }
}
