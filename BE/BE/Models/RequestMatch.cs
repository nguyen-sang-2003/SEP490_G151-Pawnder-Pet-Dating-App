using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Requestmatch
{
    public int Matchid { get; set; }

    public int? Fromuserid { get; set; }

    public int? Touserid { get; set; }

    public string? Statusrequest { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual User? Fromuser { get; set; }

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual User? Touser { get; set; }
}
