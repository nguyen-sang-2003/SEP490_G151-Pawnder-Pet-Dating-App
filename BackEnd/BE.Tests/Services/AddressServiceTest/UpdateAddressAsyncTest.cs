using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Text.Json;
using Xunit;

namespace BE.Tests.Services.AddressServiceTest
{
    public class UpdateAddressAsyncTest : IDisposable
    {
        private readonly Mock<IAddressRepository> _mockAddressRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<IMemoryCache> _mockCache;
        private readonly AddressService _addressService;

        public UpdateAddressAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockAddressRepository = new Mock<IAddressRepository>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockCache = new Mock<IMemoryCache>();

            // Setup IMemoryCache
            object? cacheValue = null;
            _mockCache
                .Setup(x => x.TryGetValue(It.IsAny<object>(), out cacheValue))
                .Returns(false);

            var mockCacheEntry = new Mock<ICacheEntry>();
            _mockCache
                .Setup(c => c.CreateEntry(It.IsAny<object>()))
                .Returns(mockCacheEntry.Object);

            // Create real InMemory DbContext
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Khởi tạo service
            _addressService = new AddressService(
                _mockAddressRepository.Object,
                _context,
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object,
                _mockCache.Object
            );
        }

        public void Dispose()
        {
            _context?.Dispose();
        }

        // Helper method to extract Address from response
        private static object? ExtractAddress(object? result)
        {
            if (result == null) return null;
            
            var resultType = result.GetType();
            var addressProperty = resultType.GetProperty("Address");
            return addressProperty?.GetValue(result);
        }

        // Helper method to get property value from anonymous object
        private static T? GetPropertyValue<T>(object? obj, string propertyName)
        {
            if (obj == null) return default;
            
            var type = obj.GetType();
            var property = type.GetProperty(propertyName);
            var value = property?.GetValue(obj);
            
            return (T?)value;
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid AddressId, valid Latitude, valid Longitude, address exists, returns valid fullAddress
        /// Expected: Return response with updated Address properties
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdateAddressAsync_ValidAddressAndCoordinates_ReturnsSuccessResponse()
        {
            // Arrange
            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "TP.HCM",
                City = "TP.HCM",
                District = "Q1",
                Ward = "P1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 20m,
                Longitude = 105m
            };

            _mockConfiguration
                .Setup(c => c["LocationIQ:ApiKey"])
                .Returns("test-api-key");

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Callback<Address, CancellationToken>((a, ct) =>
                {
                    _context.Entry(a).State = EntityState.Modified;
                    _context.SaveChangesAsync();
                })
                .Returns(Task.CompletedTask);

            // Act
            var result = await _addressService.UpdateAddressAsync(1, locationDto);

            // Assert
            Assert.NotNull(result);
            var addressObj = ExtractAddress(result);
            Assert.NotNull(addressObj);
            
            var addressId = GetPropertyValue<int>(addressObj, "AddressId");
            Assert.Equal(1, addressId);
        }

        /// <summary>
        /// UTCID02: Abnormal case - Invalid AddressId (999, not exists)
        /// Expected: Throw KeyNotFoundException with message "Không tìm thấy địa chỉ"
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdateAddressAsync_AddressNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            var locationDto = new LocationDto
            {
                Latitude = 20m,
                Longitude = 105m
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Address?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _addressService.UpdateAddressAsync(999, locationDto));

            Assert.Contains("Không tìm thấy địa chỉ", exception.Message);
        }

        /// <summary>
        /// UTCID03: Abnormal case - Valid AddressId, invalid Latitude (-20, less than -90)
        /// Expected: Throw ArgumentException with message "Latitude phải nằm..."
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdateAddressAsync_InvalidLatitudeNegative_ThrowsArgumentException()
        {
            // Arrange
            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "TP.HCM",
                City = "TP.HCM",
                District = "Q1",
                Ward = "P1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = -100m,  // Invalid: < -90
                Longitude = 105m
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _addressService.UpdateAddressAsync(1, locationDto));

            Assert.Contains("Latitude phải nằm", exception.Message);
        }

        /// <summary>
        /// UTCID04: Abnormal case - Valid AddressId, invalid Longitude (-105, less than -180)
        /// Expected: Throw ArgumentException with message "Longitude phải nằm..."
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdateAddressAsync_InvalidLongitudeNegative_ThrowsArgumentException()
        {
            // Arrange
            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "TP.HCM",
                City = "TP.HCM",
                District = "Q1",
                Ward = "P1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 20m,
                Longitude = -200m  // Invalid: < -180
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _addressService.UpdateAddressAsync(1, locationDto));

            Assert.Contains("Longitude phải nằm", exception.Message);
        }

        /// <summary>
        /// UTCID05: Abnormal case - Valid AddressId, valid coordinates, but GeocodeAsync returns null/empty
        /// Expected: Updates with fallback message in FullAddress
        /// </summary>
        [Fact]
        public async Task UTCID05_UpdateAddressAsync_GeocodeReturnsEmpty_UpdatesWithFallbackMessage()
        {
            // Arrange
            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "TP.HCM",
                City = "TP.HCM",
                District = "Q1",
                Ward = "P1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 0m,  // Boundary case, geocoding may return null
                Longitude = 0m
            };

            _mockConfiguration
                .Setup(c => c["LocationIQ:ApiKey"])
                .Returns("test-api-key");

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Callback<Address, CancellationToken>((a, ct) =>
                {
                    _context.Entry(a).State = EntityState.Modified;
                    _context.SaveChangesAsync();
                })
                .Returns(Task.CompletedTask);

            // Act
            var result = await _addressService.UpdateAddressAsync(1, locationDto);

            // Assert
            Assert.NotNull(result);
            var addressObj = ExtractAddress(result);
            Assert.NotNull(addressObj);
            
            var addressId = GetPropertyValue<int>(addressObj, "AddressId");
            var latitude = GetPropertyValue<decimal>(addressObj, "Latitude");
            var longitude = GetPropertyValue<decimal>(addressObj, "Longitude");
            var fullAddress = GetPropertyValue<string>(addressObj, "FullAddress");
            
            Assert.Equal(1, addressId);
            Assert.Equal(0m, latitude);
            Assert.Equal(0m, longitude);
            Assert.Contains("Địa chỉ sai", fullAddress);
        }

        /// <summary>
        /// UTCID06: Normal case - Valid AddressId, valid coordinates, verify all updated properties are correct
        /// Expected: Return response with all updated Address properties correctly set
        /// </summary>
        [Fact]
        public async Task UTCID06_UpdateAddressAsync_AllPropertiesUpdated_VerifyAllUpdates()
        {
            // Arrange
            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "TP.HCM Old",
                City = "TP.HCM Old",
                District = "Q1 Old",
                Ward = "P1 Old",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 20m,
                Longitude = 105m
            };

            _mockConfiguration
                .Setup(c => c["LocationIQ:ApiKey"])
                .Returns("test-api-key");

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Callback<Address, CancellationToken>((a, ct) =>
                {
                    // Update the context with new values
                    a.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
                    _context.Entry(a).State = EntityState.Modified;
                    _context.SaveChangesAsync();
                })
                .Returns(Task.CompletedTask);

            // Act
            var result = await _addressService.UpdateAddressAsync(1, locationDto);

            // Assert
            Assert.NotNull(result);
            var addressObj = ExtractAddress(result);
            Assert.NotNull(addressObj);
            
            var addressId = GetPropertyValue<int>(addressObj, "AddressId");
            var latitude = GetPropertyValue<decimal>(addressObj, "Latitude");
            var longitude = GetPropertyValue<decimal>(addressObj, "Longitude");
            var fullAddress = GetPropertyValue<string>(addressObj, "FullAddress");
            var updatedAt = GetPropertyValue<DateTime?>(addressObj, "UpdatedAt");
            
            Assert.Equal(1, addressId);
            Assert.Equal(20m, latitude);
            Assert.Equal(105m, longitude);
            Assert.NotNull(fullAddress);
            Assert.NotNull(updatedAt);
        }

        #endregion
    }
}
