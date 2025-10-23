using BE.DTO;
using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Net.Http;
using System.Text.Json;

namespace BE.Controllers
{
	[ApiController]
	public class AddressController : ControllerBase
	{
		private readonly PawnderDatabaseContext _context;
		private readonly HttpClient _httpClient;

		public AddressController(PawnderDatabaseContext context, IHttpClientFactory httpClientFactory)
		{
			_context = context;
			_httpClient = httpClientFactory.CreateClient();
		}

		[HttpPost("address/{userId}")]
		public async Task<IActionResult> CreateAddressForUser(int userId, [FromBody] LocationDto locationDto)
		{
			var user = await _context.Users.FindAsync(userId);
			if (user == null)
				return NotFound(new { message = "Không tìm thấy người dùng" });

			if (user.AddressId.HasValue)
			{
				return BadRequest(new { message = "User đã có địa chỉ, không thể tạo mới" });
			}

			string latStr = locationDto.Latitude.ToString(CultureInfo.InvariantCulture);
			string lonStr = locationDto.Longitude.ToString(CultureInfo.InvariantCulture);
			string url = $"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={latStr}&lon={lonStr}";

			string fullAddress;
			string city = null;
			string district = null;
			string ward = null;

			try
			{
				var request = new HttpRequestMessage(HttpMethod.Get, url);
				request.Headers.UserAgent.ParseAdd("PawnderApp/1.0 (contact@example.com)");

				var response = await _httpClient.SendAsync(request);
				if (response.IsSuccessStatusCode)
				{
					var json = await response.Content.ReadAsStringAsync();
					
					// DEBUG: Log raw JSON response
					Console.WriteLine("=== OpenStreetMap Response ===");
					Console.WriteLine(json);
					Console.WriteLine("==============================");
					
					var osmResult = JsonSerializer.Deserialize<OpenStreetMapResponse>(json);
					fullAddress = osmResult?.display_name;

					// Parse City, District, Ward from address components
					if (osmResult?.address != null)
					{
						var addr = osmResult.address;
						
						// DEBUG: Log all address fields
						Console.WriteLine("=== Address Components ===");
						Console.WriteLine($"city: {addr.city}");
						Console.WriteLine($"town: {addr.town}");
						Console.WriteLine($"province: {addr.province}");
						Console.WriteLine($"state: {addr.state}");
						Console.WriteLine($"suburb: {addr.suburb}");
						Console.WriteLine($"city_district: {addr.city_district}");
						Console.WriteLine($"state_district: {addr.state_district}");
						Console.WriteLine($"county: {addr.county}");
						Console.WriteLine($"quarter: {addr.quarter}");
						Console.WriteLine($"neighbourhood: {addr.neighbourhood}");
						Console.WriteLine("=========================");
						
						// City: city > town > province > state
						string rawCity = addr.city ?? addr.town ?? addr.province ?? addr.state;
						city = CleanVietnameseAddress(rawCity, new[] { "Thành phố", "Tỉnh" });
						
						// District: city_district > state_district > county
						string rawDistrict = addr.city_district ?? addr.state_district ?? addr.county;
						district = CleanVietnameseAddress(rawDistrict, new[] { "Quận", "Huyện" });
						
						// Ward: suburb > quarter > neighbourhood
						string rawWard = addr.suburb ?? addr.quarter ?? addr.neighbourhood;
						ward = CleanVietnameseAddress(rawWard, new[] { "Phường", "Xã", "Thị trấn" });
						
						Console.WriteLine($"Parsed - City: {city}, District: {district}, Ward: {ward}");
					}
					else
					{
						Console.WriteLine("WARNING: No address components in response");
					}
				}
				else
				{
					fullAddress = null;
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine($"ERROR parsing address: {ex.Message}");
				fullAddress = null;
			}

			if (string.IsNullOrEmpty(fullAddress))
			{
				return BadRequest(new { message = $"Không tìm thấy địa chỉ hợp lệ tại Lat:{latStr}, Lon:{lonStr}" });
			}

			var address = new Address
			{
				Latitude = locationDto.Latitude,
				Longitude = locationDto.Longitude,
				FullAddress = fullAddress,
				City = city,
				District = district,
				Ward = ward,
				CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified),
				UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
			};

			_context.Addresses.Add(address);
			await _context.SaveChangesAsync(); 

			user.AddressId = address.AddressId;
			user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
			await _context.SaveChangesAsync();

			return Ok(new
			{
				User = new
				{
					user.UserId,
					user.FullName,
					user.Email,
					user.AddressId
				},
				Address = new
				{
					address.AddressId,
					address.Latitude,
					address.Longitude,
					address.FullAddress
				}
			});
		}

		// PUT: /address/{addressId}
		[HttpPut("address/{addressId}")]
		public async Task<IActionResult> UpdateAddress(int addressId, [FromBody] LocationDto locationDto)
		{
			var address = await _context.Addresses.FindAsync(addressId);
			if (address == null)
				return NotFound(new { message = "Không tìm thấy địa chỉ" });

			address.Latitude = locationDto.Latitude;
			address.Longitude = locationDto.Longitude;

			string latStr = locationDto.Latitude.ToString(CultureInfo.InvariantCulture);
			string lonStr = locationDto.Longitude.ToString(CultureInfo.InvariantCulture);
			string url = $"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={latStr}&lon={lonStr}";

			var request = new HttpRequestMessage(HttpMethod.Get, url);
			request.Headers.UserAgent.ParseAdd("PawnderApp/1.0 (contact@example.com)");

			var response = await _httpClient.SendAsync(request);

			if (response.IsSuccessStatusCode)
			{
				var json = await response.Content.ReadAsStringAsync();
				var osmResult = JsonSerializer.Deserialize<OpenStreetMapResponse>(json);

				address.FullAddress = !string.IsNullOrEmpty(osmResult?.display_name)
					? osmResult.display_name
					: $"Địa chỉ sai, Lat:{latStr}, Lon:{lonStr}";

				// Parse City, District, Ward
				if (osmResult?.address != null)
				{
					var addr = osmResult.address;
					string rawCity = addr.city ?? addr.town ?? addr.province ?? addr.state;
					address.City = CleanVietnameseAddress(rawCity, new[] { "Thành phố", "Tỉnh" });
					
					string rawDistrict = addr.city_district ?? addr.state_district ?? addr.county;
					address.District = CleanVietnameseAddress(rawDistrict, new[] { "Quận", "Huyện" });
					
					string rawWard = addr.suburb ?? addr.quarter ?? addr.neighbourhood;
					address.Ward = CleanVietnameseAddress(rawWard, new[] { "Phường", "Xã", "Thị trấn" });
				}
			}
			else
			{
				address.FullAddress = $"Địa chỉ sai, Lat:{latStr}, Lon:{lonStr}";
			}

			address.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

			await _context.SaveChangesAsync();

			return Ok(new
			{
				Address = new
				{
					address.AddressId,
					address.Latitude,
					address.Longitude,
					address.FullAddress,
					address.UpdatedAt
				}
			});
		}

		// GET: /address/{addressId}
		[HttpGet("address/{addressId}")]
		public async Task<IActionResult> GetAddressById(int addressId)
		{
			var address = await _context.Addresses.FindAsync(addressId);
			if (address == null)
				return NotFound(new { message = "Không tìm thấy địa chỉ" });

			return Ok(new
			{
				Address = new
				{
					address.AddressId,
					address.Latitude,
					address.Longitude,
					address.FullAddress,
					address.City,
					address.District,
					address.Ward,
					CreatedAt = address.CreatedAt?.ToString("yyyy-MM-dd HH:mm:ss"),
					UpdatedAt = address.UpdatedAt?.ToString("yyyy-MM-dd HH:mm:ss")
				}
			});
		}

		// Helper method to clean Vietnamese address prefixes
		private string CleanVietnameseAddress(string rawAddress, string[] prefixes)
		{
			if (string.IsNullOrEmpty(rawAddress))
				return null;

			string cleaned = rawAddress.Trim();
			foreach (var prefix in prefixes)
			{
				// Remove prefix (case-insensitive)
				if (cleaned.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
				{
					cleaned = cleaned.Substring(prefix.Length).Trim();
					break;
				}
			}
			return string.IsNullOrEmpty(cleaned) ? null : cleaned;
		}
	}
}
	


