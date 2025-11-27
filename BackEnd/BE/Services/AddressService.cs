using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
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
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;
        
        // Rate limiting: Tối đa 1 request/giây cho mỗi user để tránh spam LocationIQ API
        private const int MAX_REQUESTS_PER_SECOND = 1;
        private static readonly TimeSpan RATE_LIMIT_WINDOW = TimeSpan.FromSeconds(1);

        public AddressService(
            IAddressRepository addressRepository,
            PawnderDatabaseContext context,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IMemoryCache cache)
        {
            _addressRepository = addressRepository;
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            _configuration = configuration;
            _cache = cache;
        }

        public async Task<object> CreateAddressForUserAsync(int userId, LocationDto locationDto, CancellationToken ct = default)
        {
            // Validation: Kiểm tra coordinates hợp lệ
            ValidateCoordinates(locationDto.Latitude, locationDto.Longitude);
            
            // Rate limiting: Kiểm tra số lượng requests trong 1 giây
            if (!CheckRateLimit(userId))
            {
                throw new InvalidOperationException($"Bạn đã vượt quá giới hạn {MAX_REQUESTS_PER_SECOND} request/giây. Vui lòng thử lại sau.");
            }

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
            // Validation: Kiểm tra coordinates hợp lệ
            ValidateCoordinates(locationDto.Latitude, locationDto.Longitude);
            
            var address = await _addressRepository.GetAddressByIdAsync(addressId, ct);
            if (address == null)
                throw new KeyNotFoundException("Không tìm thấy địa chỉ");

            // Rate limiting: Lấy userId từ address để check rate limit
            var user = await _context.Users.FirstOrDefaultAsync(u => u.AddressId == addressId, ct);
            if (user != null && !CheckRateLimit(user.UserId))
            {
                throw new InvalidOperationException($"Bạn đã vượt quá giới hạn {MAX_REQUESTS_PER_SECOND} request/giây. Vui lòng thử lại sau.");
            }

            address.Latitude = locationDto.Latitude;
            address.Longitude = locationDto.Longitude;

            // Business logic: Geocode lại
            var (fullAddress, city, district, ward) = await GeocodeAsync(locationDto.Latitude, locationDto.Longitude, ct);

            address.FullAddress = !string.IsNullOrEmpty(fullAddress)
                ? fullAddress
                : $"Địa chỉ sai, Lat:{locationDto.Latitude}, Lon:{locationDto.Longitude}";

            address.City = city;
            address.District = district;
            address.Ward = ward;

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
            string key = _configuration["LocationIQ:ApiKey"] ?? throw new InvalidOperationException("LocationIQ API key không được cấu hình");
            string url = $"https://us1.locationiq.com/v1/reverse?key={key}&lat={latStr}&lon={lonStr}&format=json";

            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, url);

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
                        
                        // City (Thành phố): Cấp thành phố/tỉnh - cấp hành chính lớn nhất
                        // Theo LocationIQ: city, state, town, region, country
                        // Ưu tiên: city > state > town > region > country
                        // Tất cả các trường này đều optional, chỉ lấy giá trị đầu tiên có sẵn
                        string? rawCity = addr.city ?? addr.state ?? addr.town ?? addr.region ?? addr.country;
                        city = string.IsNullOrEmpty(rawCity) ? null : CleanVietnameseAddress(rawCity, new[] { "Thành phố", "Tỉnh" });

                        // District (Quận): Cấp quận/huyện - cấp hành chính trung gian
                        // Theo LocationIQ: city_district, state_district, county
                        // Ưu tiên: city_district > state_district > county
                        // Tất cả các trường này đều optional, chỉ lấy giá trị đầu tiên có sẵn
                        string? rawDistrict = addr.city_district ?? addr.state_district ?? addr.county;
                        district = string.IsNullOrEmpty(rawDistrict) ? null : CleanVietnameseAddress(rawDistrict, new[] { "Quận", "Huyện" });

                        // Ward (Phường): Cấp phường/xã - cấp hành chính nhỏ nhất
                        // Theo LocationIQ: suburb, village, neighbourhood, hamlet
                        // Ưu tiên: suburb > village > neighbourhood > hamlet
                        // Tất cả các trường này đều optional, chỉ lấy giá trị đầu tiên có sẵn
                        string? rawWard = addr.suburb ?? addr.village ?? addr.neighbourhood ?? addr.hamlet;
                        ward = string.IsNullOrEmpty(rawWard) ? null : CleanVietnameseAddress(rawWard, new[] { "Phường", "Xã", "Thị trấn" });
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

        // Validation: Kiểm tra coordinates hợp lệ
        private void ValidateCoordinates(decimal latitude, decimal longitude)
        {
            // Latitude: -90 đến 90
            if (latitude < -90 || latitude > 90)
                throw new ArgumentException($"Latitude phải nằm trong khoảng -90 đến 90. Giá trị hiện tại: {latitude}");

            // Longitude: -180 đến 180
            if (longitude < -180 || longitude > 180)
                throw new ArgumentException($"Longitude phải nằm trong khoảng -180 đến 180. Giá trị hiện tại: {longitude}");
        }

        // Rate limiting: Kiểm tra và ghi nhận request để tránh spam
        private bool CheckRateLimit(int userId)
        {
            var cacheKey = $"geocode_rate_limit_{userId}";
            var now = DateTime.UtcNow;

            if (_cache.TryGetValue(cacheKey, out List<DateTime>? requestTimes) && requestTimes != null)
            {
                // Xóa các requests cũ hơn 1 giây
                requestTimes.RemoveAll(time => now - time > RATE_LIMIT_WINDOW);

                // Kiểm tra số lượng requests trong 1 giây
                if (requestTimes.Count >= MAX_REQUESTS_PER_SECOND)
                {
                    return false; // Vượt quá giới hạn
                }

                // Thêm request hiện tại
                requestTimes.Add(now);
            }
            else
            {
                // Tạo mới danh sách requests
                requestTimes = new List<DateTime> { now };
            }

            // Lưu vào cache với expiration time
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = RATE_LIMIT_WINDOW,
                SlidingExpiration = RATE_LIMIT_WINDOW
            };
            _cache.Set(cacheKey, requestTimes, cacheOptions);

            return true; // Cho phép request
        }
    }
}

