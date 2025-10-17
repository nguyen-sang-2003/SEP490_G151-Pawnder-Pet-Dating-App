using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Pet
{
    public Guid PetId { get; set; }

    public Guid? UserId { get; set; }

    public string? Name { get; set; }

    public string? Breed { get; set; }

    public string? Gender { get; set; }

    public int? Age { get; set; }

    public bool? IsDeadted { get; set; }

    public bool? IsDeleted { get; set; }

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<PetCharacteristic> PetCharacteristics { get; set; } = new List<PetCharacteristic>();

    public virtual ICollection<PetPhoto> PetPhotos { get; set; } = new List<PetPhoto>();

    public virtual User? User { get; set; }
}
