using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Message
{
    public int Messageid { get; set; }

    public int? Matchid { get; set; }

    public int? Userid { get; set; }

    public string? Content { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual Requestmatch? Match { get; set; }

    public virtual User? User { get; set; }
}
