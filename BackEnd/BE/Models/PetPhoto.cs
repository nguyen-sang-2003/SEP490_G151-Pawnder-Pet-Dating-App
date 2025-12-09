using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class PetPhoto
{
    public int PhotoId { get; set; }

    public int PetId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? PublicId { get; set; }          // <--- thêm

    public bool IsPrimary { get; set; } = false;

    public int SortOrder { get; set; } = 0;

    public bool IsDeleted { get; set; } = false;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Pet Pet { get; set; } = null!;
}

