using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Userpreference
{
    public int Userpreferenceid { get; set; }

    public int? Userid { get; set; }

    public int? Attributeid { get; set; }

    public string? Value { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual Attribute? Attribute { get; set; }

    public virtual User? User { get; set; }
}
