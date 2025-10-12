using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Pet
{
    public int Petid { get; set; }

    public int? Userid { get; set; }

    public string? Name { get; set; }

    public string? Breed { get; set; }

    public string? Gender { get; set; }

    public int? Age { get; set; }

    public string? Description { get; set; }

    public DateTime? Createdat { get; set; }

    public DateTime? Updatedat { get; set; }

    public virtual ICollection<Petcharacteristic> Petcharacteristics { get; set; } = new List<Petcharacteristic>();

    public virtual ICollection<Petphoto> Petphotos { get; set; } = new List<Petphoto>();

    public virtual User? User { get; set; }
}
