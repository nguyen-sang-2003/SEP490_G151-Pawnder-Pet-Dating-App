using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class AttributeOption
{
    public int OptionId { get; set; }

    public int? AttributeId { get; set; }

    public string Name { get; set; } = null!;

    public bool? IsDeleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Attribute? Attribute { get; set; }

    public virtual ICollection<PetCharacteristic> PetCharacteristics { get; set; } = new List<PetCharacteristic>();

    public virtual ICollection<UserPreference> UserPreferences { get; set; } = new List<UserPreference>();
}
