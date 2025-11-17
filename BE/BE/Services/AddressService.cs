using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Net.Http;
using System.Text.Json;

namespace BE.Services
{
    public class AddressService : IAddressService
    {
        private readonly IAddressRepository _addressRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly HttpClient _httpClient;

        public AddressService(
            IAddressRepository addressRepository,
            PawnderDatabaseContext context,
            IHttpClientFactory httpClientFactory)
        {
            _addressRepository = addressRepository;
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task<object> CreateAddressForUserAsync(int userId, LocationDto locationDto, CancellationToken ct = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng");

            if (user.AddressId.HasValue)
                throw new InvalidOperationException("User đã có địa chỉ, không thể tạo mới. Hãy dùng PUT để update.");

            // Business logic: Geocode từ GPS coordinates
            var (fullAddress, city, district, ward) = await GeocodeAsync(locationDto.Latitude, locationDto.Longitude, ct);

            if (string.IsNullOrEmpty(fullAddress))
                throw new InvalidOperationException($"Không tìm thấy địa chỉ hợp lệ tại Lat:{locationDto.Latitude}, Lon:{locationDto.Longitude}");

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

            await _addressRepository.AddAsync(address, ct);

            user.AddressId = address.AddressId;
            user.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync(ct);

            return new
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
                    address.FullAddress,
                    address.City,
                    address.District,
                    address.Ward
                }
            };
        }

        public async Task<object> UpdateAddressAsync(int addressId, LocationDto locationDto, CancellationToken ct = default)
        {
            var address = await _addressRepository.GetAddressByIdAsync(addressId, ct);
            if (address == null)
                throw new KeyNotFoundException("Không tìm thấy địa chỉ");

            address.Latitude = locationDto.Latitude;
            address.Longitude = locationDto.Longitude;

            // Business logic: Geocode lại
            var (fullAddress, city, district, ward) = await GeocodeAsync(locationDto.Latitude, locationDto.Longitude, ct);

            address.FullAddress = !string.IsNullOrEmpty(fullAddress)
                ? fullAddress
                : $"Địa chỉ sai, Lat:{locationDto.Latitude}, Lon:{locationDto.Longitude}";

            if (!string.IsNullOrEmpty(city)) address.City = city;
            if (!string.IsNullOrEmpty(district)) address.District = district;
            if (!string.IsNullOrEmpty(ward)) address.Ward = ward;

            address.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            await _addressRepository.UpdateAsync(address, ct);

            return new
            {
                Address = new
                {
                    address.AddressId,
                    address.Latitude,
                    address.Longitude,
                    address.FullAddress,
                    address.UpdatedAt
                }
            };
        }

        public async Task<object> UpdateAddressManualAsync(int addressId, ManualAddressDto dto, CancellationToken ct = default)
        {
            var address = await _addressRepository.GetAddressByIdAsync(addressId, ct);
            if (address == null)
                throw new KeyNotFoundException("Không tìm thấy địa chỉ");

            // Business logic: Update manual address
            if (!string.IsNullOrEmpty(dto.City))
                address.City = dto.City;
            if (!string.IsNullOrEmpty(dto.District))
                address.District = dto.District;
            if (!string.IsNullOrEmpty(dto.Ward))
                address.Ward = dto.Ward;

            address.FullAddress = $"{dto.Ward}, {dto.District}, {dto.City}".Trim(' ', ',');
            address.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            await _addressRepository.UpdateAsync(address, ct);

            return new
            {
                message = "Cập nhật địa chỉ thành công",
                Address = new
                {
                    address.AddressId,
                    address.City,
                    address.District,
                    address.Ward,
                    address.FullAddress,
                    address.UpdatedAt
                }
            };
        }

        public async Task<object> GetAddressByIdAsync(int addressId, CancellationToken ct = default)
        {
            var address = await _addressRepository.GetAddressByIdAsync(addressId, ct);
            if (address == null)
                throw new KeyNotFoundException("Không tìm thấy địa chỉ");

            return new
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
            };
        }

        // Helper method: Geocode từ GPS coordinates
        private async Task<(string? FullAddress, string? City, string? District, string? Ward)> GeocodeAsync(
            decimal latitude, decimal longitude, CancellationToken ct)
        {
            string latStr = latitude.ToString(CultureInfo.InvariantCulture);
            string lonStr = longitude.ToString(CultureInfo.InvariantCulture);
            string url = $"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={latStr}&lon={lonStr}";

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.UserAgent.ParseAdd("PawnderApp/1.0 (contact@example.com)");

                var response = await _httpClient.SendAsync(request, ct);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync(ct);
                    var osmResult = JsonSerializer.Deserialize<OpenStreetMapResponse>(json);

                    string? fullAddress = osmResult?.display_name;
                    string? city = null;
                    string? district = null;
                    string? ward = null;

                    if (osmResult?.address != null)
                    {
                        var addr = osmResult.address;
                        string? rawCity = addr.city ?? addr.town ?? addr.province ?? addr.state;
                        city = CleanVietnameseAddress(rawCity, new[] { "Thành phố", "Tỉnh" });

                        string? rawDistrict = addr.city_district ?? addr.state_district ?? addr.county;
                        district = CleanVietnameseAddress(rawDistrict, new[] { "Quận", "Huyện" });

                        string? rawWard = addr.suburb ?? addr.quarter ?? addr.neighbourhood;
                        ward = CleanVietnameseAddress(rawWard, new[] { "Phường", "Xã", "Thị trấn" });
                    }

                    return (fullAddress, city, district, ward);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR parsing address: {ex.Message}");
            }

            return (null, null, null, null);
        }

        private string? CleanVietnameseAddress(string? rawAddress, string[] prefixes)
        {
            if (string.IsNullOrEmpty(rawAddress))
                return null;

            string cleaned = rawAddress.Trim();
            foreach (var prefix in prefixes)
            {
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

