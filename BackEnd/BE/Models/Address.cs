using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class Address
{
    public int AddressId { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public string FullAddress { get; set; } = null!;

    public string? City { get; set; }

    public string? District { get; set; }

    public string? Ward { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
