namespace BE.DTO
{
	public class LocationDto
	{
		public decimal Latitude { get; set; }
		public decimal Longitude { get; set; }
	}

	public class ManualAddressDto
	{
		public string? City { get; set; }
		public string? District { get; set; }
		public string? Ward { get; set; }
	}

	public class OpenStreetMapResponse
	{
		public string? display_name { get; set; }
		public AddressComponents? address { get; set; }
	}

	public class AddressComponents
	{
		public string? city { get; set; }
		public string? town { get; set; }
		public string? province { get; set; }
		public string? state { get; set; }
		public string? region { get; set; }
		public string? country { get; set; }
		public string? county { get; set; }
		public string? suburb { get; set; }
		public string? quarter { get; set; }
		public string? neighbourhood { get; set; }
		public string? village { get; set; }
		public string? hamlet { get; set; }
		public string? city_district { get; set; }
		public string? state_district { get; set; }
	}
}
