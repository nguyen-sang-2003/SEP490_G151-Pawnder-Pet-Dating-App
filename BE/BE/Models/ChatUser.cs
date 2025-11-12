using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ChatUser
{
    public int MatchId { get; set; }

    public int? FromUserId { get; set; }

    public int? ToUserId { get; set; }

    public int? FromPetId { get; set; }

    public int? ToPetId { get; set; }

    public string? Status { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatUserContent> ChatUserContents { get; set; } = new List<ChatUserContent>();

    public virtual User? FromUser { get; set; }

    public virtual Pet? FromPet { get; set; }

    public virtual Pet? ToPet { get; set; }
    public virtual User? ToUser { get; set; }
}
