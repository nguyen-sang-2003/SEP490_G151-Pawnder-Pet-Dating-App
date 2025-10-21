namespace BE.DTO
{
	public class LocationDto
	{
		public decimal Latitude { get; set; }
		public decimal Longitude { get; set; }
	}

	public class OpenStreetMapResponse
	{
		public string? display_name { get; set; }
	}
}
