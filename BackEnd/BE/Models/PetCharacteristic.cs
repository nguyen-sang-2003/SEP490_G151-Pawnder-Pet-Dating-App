using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class PetCharacteristic
{
    public int PetId { get; set; }

    public int AttributeId { get; set; }

    public int? OptionId { get; set; }

    public int? Value { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Attribute Attribute { get; set; } = null!;

    public virtual AttributeOption? Option { get; set; }

    public virtual Pet Pet { get; set; } = null!;
}
