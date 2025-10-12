using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Attribute
{
    public int Attributeid { get; set; }

    public string Name { get; set; } = null!;

    public string? Typevalue { get; set; }

    public string? Unit { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual ICollection<Petcharacteristic> Petcharacteristics { get; set; } = new List<Petcharacteristic>();

    public virtual ICollection<Userpreference> Userpreferences { get; set; } = new List<Userpreference>();
}
