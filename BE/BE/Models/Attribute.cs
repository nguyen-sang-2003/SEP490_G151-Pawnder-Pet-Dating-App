using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Attribute
{
    public Guid Attributeid { get; set; }

    public string Name { get; set; } = null!;

    public string? TypeValue { get; set; }

    public string? Unit { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<PetCharacteristic> PetCharacteristics { get; set; } = new List<PetCharacteristic>();

    public virtual ICollection<UserPreference> UserPreferences { get; set; } = new List<UserPreference>();
}
