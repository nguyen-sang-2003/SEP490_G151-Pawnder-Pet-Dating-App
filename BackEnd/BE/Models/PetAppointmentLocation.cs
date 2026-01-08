using System;
using System.Collections.Generic;

namespace BE.Models;

/// <summary>
/// Địa điểm hẹn gặp thú cưng (Pet-Friendly locations)
/// </summary>
public partial class PetAppointmentLocation
{
    public int LocationId { get; set; }

    public string Name { get; set; } = null!;

    public string Address { get; set; } = null!;

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public string? City { get; set; }

    public string? District { get; set; }

    public bool? IsPetFriendly { get; set; }

    /// <summary>
    /// Loại địa điểm: park, pet_cafe, vet_clinic, custom
    /// </summary>
    public string? PlaceType { get; set; }

    /// <summary>
    /// Google Place ID cho tích hợp Google Maps API
    /// </summary>
    public string? GooglePlaceId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<PetAppointment> PetAppointments { get; set; } = new List<PetAppointment>();
}
