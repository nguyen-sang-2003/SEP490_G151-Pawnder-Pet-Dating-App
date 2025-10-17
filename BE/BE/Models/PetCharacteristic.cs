using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class PetCharacteristic
{
    public Guid PetId { get; set; }

    public Guid AttributeId { get; set; }

    public string? Value { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Attribute Attribute { get; set; } = null!;

    public virtual Pet Pet { get; set; } = null!;
}
