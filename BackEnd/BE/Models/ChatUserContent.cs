using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class ChatUserContent
{
    public int ContentId { get; set; }

    public int? MatchId { get; set; }

    public int? FromUserId { get; set; }

    public int? FromPetId { get; set; }

    public string? Message { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? FromUser { get; set; }

    public virtual Pet? FromPet { get; set; }

    public virtual ChatUser? Match { get; set; }

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}
