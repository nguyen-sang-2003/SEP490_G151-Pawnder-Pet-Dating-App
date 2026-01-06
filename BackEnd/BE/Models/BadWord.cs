using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class BadWord
{
    public int BadWordId { get; set; }

    public string Word { get; set; } = null!;

    public bool IsRegex { get; set; }

    public int Level { get; set; }

    public string? Category { get; set; }

    public bool IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}

