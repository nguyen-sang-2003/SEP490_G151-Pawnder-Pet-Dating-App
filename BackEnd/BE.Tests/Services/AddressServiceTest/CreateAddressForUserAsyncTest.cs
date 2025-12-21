using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.Protected;
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
        private AddressService? _addressService;

        public CreateAddressForUserAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockAddressRepository = new Mock<IAddressRepository>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockCache = new Mock<IMemoryCache>();

            // Setup IConfiguration - LocationIQ API key
            _mockConfiguration
                .Setup(x => x["LocationIQ:ApiKey"])
                .Returns("test_api_key_123");

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
        }

        private void CreateAddressService()
        {
            // Create the service after all mocks are configured
            _addressService = new AddressService(
                _mockAddressRepository.Object,
                _context,
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object,
                _mockCache.Object
            );
        }

        private void SetupHttpClientMock(HttpResponseMessage responseMessage)
        {
            var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(responseMessage);

            var realHttpClient = new HttpClient(mockHttpMessageHandler.Object);
            _mockHttpClientFactory
                .Setup(x => x.CreateClient(It.IsAny<string>()))
                .Returns(realHttpClient);
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
            var mockResponse = new HttpResponseMessage
            {
                StatusCode = System.Net.HttpStatusCode.OK,
                Content = new StringContent(@"{
                    ""display_name"": ""TP.HCM"",
                    ""address"": {
                        ""city"": ""TP.HCM"",
                        ""state"": ""Ho Chi Minh City"",
                        ""country"": ""Vietnam""
                    }
                }")
            };
            SetupHttpClientMock(mockResponse);
            CreateAddressService();

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
            var result = await _addressService!.CreateAddressForUserAsync(1, locationDto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var userProp = resultType.GetProperty("User");
            var addressProp = resultType.GetProperty("Address");
            Assert.NotNull(userProp);
            Assert.NotNull(addressProp);
            Assert.NotNull(userProp.GetValue(result));
            Assert.NotNull(addressProp.GetValue(result));
        }

        /// <summary>
        /// UTCID02: Abnormal case - User doesn't exist
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateAddressForUserAsync_UserNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange - setup minimal HTTP mock since the service constructor calls CreateClient
            var mockResponse = new HttpResponseMessage { StatusCode = System.Net.HttpStatusCode.OK };
            SetupHttpClientMock(mockResponse);
            CreateAddressService();

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
            // Arrange - setup minimal HTTP mock
            var mockResponse = new HttpResponseMessage { StatusCode = System.Net.HttpStatusCode.OK };
            SetupHttpClientMock(mockResponse);
            CreateAddressService();

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
            var mockResponse = new HttpResponseMessage
            {
                StatusCode = System.Net.HttpStatusCode.OK,
                Content = new StringContent(@"{""display_name"":""Atlantic Ocean"",""address"":{""country"":""International Waters""}}")
            };
            SetupHttpClientMock(mockResponse);
            CreateAddressService();

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
            var result = await _addressService!.CreateAddressForUserAsync(1, locationDto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var addressProp = resultType.GetProperty("Address");
            Assert.NotNull(addressProp);
            var addressValue = addressProp.GetValue(result);
            Assert.NotNull(addressValue);
            var addressType = addressValue.GetType();
            var latProp = addressType.GetProperty("Latitude");
            var lonProp = addressType.GetProperty("Longitude");
            Assert.Equal(0m, latProp!.GetValue(addressValue));
            Assert.Equal(0m, lonProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID05: Abnormal case - Geocoding returns null/empty address
        /// Expected: Throw InvalidOperationException
        /// </summary>
        [Fact]
        public async Task UTCID05_CreateAddressForUserAsync_GeocodeReturnsEmpty_ThrowsInvalidOperationException()
        {
            // Arrange
            var mockResponse = new HttpResponseMessage
            {
                StatusCode = System.Net.HttpStatusCode.OK,
                Content = new StringContent(@"{
                    ""display_name"": """",
                    ""address"": {}
                }")
            };
            SetupHttpClientMock(mockResponse);
            CreateAddressService();

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
            var mockResponse = new HttpResponseMessage
            {
                StatusCode = System.Net.HttpStatusCode.OK,
                Content = new StringContent(@"{
                    ""display_name"": """",
                    ""address"": {}
                }")
            };
            SetupHttpClientMock(mockResponse);
            CreateAddressService();

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
