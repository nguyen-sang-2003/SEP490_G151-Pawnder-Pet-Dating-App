using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Location
{
    public int Locationid { get; set; }

    public int? Userid { get; set; }

    public string? Country { get; set; }

    public string? Province { get; set; }

    public string? Commune { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual User? User { get; set; }
}
