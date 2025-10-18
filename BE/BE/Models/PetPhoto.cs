using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class PetPhoto
{
    public int PhotoId { get; set; }

    public int? PetId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Pet? Pet { get; set; }
}
