using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Pet
{
    public int PetId { get; set; }

    public int? UserId { get; set; }

    public string? Name { get; set; }

    public string? Breed { get; set; }

    public string? Gender { get; set; }

    public int? Age { get; set; }

    public bool? IsActive { get; set; }

    public bool? IsDeleted { get; set; }

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatUserContent> ChatUserContents { get; set; } = new List<ChatUserContent>();

    public virtual ICollection<ChatUser> ChatUserFromPets { get; set; } = new List<ChatUser>();

    public virtual ICollection<ChatUser> ChatUserToPets { get; set; } = new List<ChatUser>();

    public virtual ICollection<PetCharacteristic> PetCharacteristics { get; set; } = new List<PetCharacteristic>();

    public virtual ICollection<PetPhoto> PetPhotos { get; set; } = new List<PetPhoto>();

    public virtual User? User { get; set; }

    // PetAppointment navigation properties
    public virtual ICollection<PetAppointment> PetAppointmentsAsInviter { get; set; } = new List<PetAppointment>();

    public virtual ICollection<PetAppointment> PetAppointmentsAsInvitee { get; set; } = new List<PetAppointment>();

    // Event navigation properties
    public virtual ICollection<EventSubmission> EventSubmissions { get; set; } = new List<EventSubmission>();
}
