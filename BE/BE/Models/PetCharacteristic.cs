using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Petcharacteristic
{
    public int Petcharacteristicid { get; set; }

    public int? Petid { get; set; }

    public int? Attributeid { get; set; }

    public string? Value { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual Attribute? Attribute { get; set; }

    public virtual Pet? Pet { get; set; }
}
