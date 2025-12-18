using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BE.Tests.Services.AddressServiceTest
{
    public class CreateAddressForUserAsyncTest : IDisposable
    {
        private readonly Mock<IAddressRepository> _mockAddressRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<IMemoryCache> _mockCache;
        private readonly AddressService _addressService;

        public CreateAddressForUserAsyncTest()
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

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid user, valid coordinates, geocoding success
        /// Expected: Return response with User and Address
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateAddressForUserAsync_ValidUserValidCoordinates_ReturnsSuccessResponse()
        {
            // Arrange
            var user = new User
            {
                UserId = 1,
                FullName = "Nguyễn Văn A",
                Email = "user1@test.com",
                PasswordHash = "hashed_password",
                AddressId = null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 10.762622m,
                Longitude = 106.660172m
            };

            var address = new Address
            {
                Latitude = locationDto.Latitude,
                Longitude = locationDto.Longitude,
                FullAddress = "TP.HCM",
                City = "TP.HCM",
                District = "Q1",
                Ward = "P1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _mockAddressRepository
                .Setup(r => r.AddAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Callback<Address, CancellationToken>((a, ct) =>
                {
                    _context.Addresses.Add(a);
                })
                .ReturnsAsync((Address a, CancellationToken ct) =>
                {
                    _context.SaveChangesAsync();
                    return a;
                });

            // Act
            var result = await _addressService.CreateAddressForUserAsync(1, locationDto);

            // Assert
            Assert.NotNull(result);
            dynamic obj = result;
            Assert.NotNull(obj.User);
            Assert.NotNull(obj.Address);
        }

        /// <summary>
        /// UTCID02: Abnormal case - User doesn't exist
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateAddressForUserAsync_UserNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            var locationDto = new LocationDto
            {
                Latitude = 10.762622m,
                Longitude = 106.660172m
            };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _addressService.CreateAddressForUserAsync(999, locationDto));
        }

        /// <summary>
        /// UTCID03: Abnormal case - User already has an address
        /// Expected: Throw InvalidOperationException
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateAddressForUserAsync_UserAlreadyHasAddress_ThrowsInvalidOperationException()
        {
            // Arrange
            var user = new User
            {
                UserId = 1,
                FullName = "Nguyễn Văn A",
                Email = "user3@test.com",
                PasswordHash = "hashed_password",
                AddressId = 1  // Has an address
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 10.762622m,
                Longitude = 106.660172m
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _addressService.CreateAddressForUserAsync(1, locationDto));

            Assert.Contains("User đã có địa chỉ", exception.Message);
        }

        /// <summary>
        /// UTCID04: Normal case - Valid coordinates with zero values (boundary case)
        /// Expected: Return response with Address and User info
        /// </summary>
        [Fact]
        public async Task UTCID04_CreateAddressForUserAsync_ZeroCoordinatesBoundary_ReturnsSuccessResponse()
        {
            // Arrange
            var user = new User
            {
                UserId = 1,
                FullName = "Nguyễn Văn B",
                Email = "user4@test.com",
                PasswordHash = "hashed_password",
                AddressId = null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 0m,
                Longitude = 0m
            };

            _mockAddressRepository
                .Setup(r => r.AddAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Callback<Address, CancellationToken>((a, ct) =>
                {
                    _context.Addresses.Add(a);
                })
                .ReturnsAsync((Address a, CancellationToken ct) =>
                {
                    _context.SaveChangesAsync();
                    return a;
                });

            // Act
            var result = await _addressService.CreateAddressForUserAsync(1, locationDto);

            // Assert
            Assert.NotNull(result);
            dynamic obj = result;
            Assert.Equal(0m, obj.Address.Latitude);
            Assert.Equal(0m, obj.Address.Longitude);
        }

        /// <summary>
        /// UTCID05: Abnormal case - Geocoding returns null/empty address
        /// Expected: Throw InvalidOperationException
        /// </summary>
        [Fact]
        public async Task UTCID05_CreateAddressForUserAsync_GeocodeReturnsEmpty_ThrowsInvalidOperationException()
        {
            // Arrange
            var user = new User
            {
                UserId = 1,
                FullName = "Nguyễn Văn C",
                Email = "user5@test.com",
                PasswordHash = "hashed_password",
                AddressId = null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 10.762622m,
                Longitude = 106.660172m
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _addressService.CreateAddressForUserAsync(1, locationDto));

            Assert.Contains("Không tìm thấy địa chỉ hợp lệ", exception.Message);
        }

        /// <summary>
        /// UTCID06: Abnormal case - Geocoding failure with boundary coordinates
        /// Expected: Throw InvalidOperationException
        /// </summary>
        [Fact]
        public async Task UTCID06_CreateAddressForUserAsync_GeocodeFailureZeroCoords_ThrowsInvalidOperationException()
        {
            // Arrange
            var user = new User
            {
                UserId = 1,
                FullName = "Nguyễn Văn D",
                Email = "user6@test.com",
                PasswordHash = "hashed_password",
                AddressId = null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var locationDto = new LocationDto
            {
                Latitude = 0m,
                Longitude = 0m
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _addressService.CreateAddressForUserAsync(1, locationDto));

            Assert.Contains("Không tìm thấy địa chỉ hợp lệ", exception.Message);
        }

        #endregion
    }
}
