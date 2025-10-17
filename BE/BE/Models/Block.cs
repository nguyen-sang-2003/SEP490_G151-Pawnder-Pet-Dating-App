using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Block
{
    public Guid FromUserId { get; set; }

    public Guid ToUserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User FromUser { get; set; } = null!;

    public virtual User ToUser { get; set; } = null!;
}
