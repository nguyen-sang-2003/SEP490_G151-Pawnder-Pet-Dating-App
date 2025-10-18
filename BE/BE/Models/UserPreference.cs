using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class UserPreference
{
    public int UserId { get; set; }

    public int AttributeId { get; set; }

    public string? Value { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Attribute Attribute { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
