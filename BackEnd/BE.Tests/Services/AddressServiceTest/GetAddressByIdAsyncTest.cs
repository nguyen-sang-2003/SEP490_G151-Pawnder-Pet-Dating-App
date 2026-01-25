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
    public class GetAddressByIdAsyncTest : IDisposable
    {
        private readonly Mock<IAddressRepository> _mockAddressRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<IMemoryCache> _mockCache;
        private AddressService? _addressService;

        public GetAddressByIdAsyncTest()
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

        public void Dispose()
        {
            _context?.Dispose();
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid AddressId that exists
        /// Expected: Return response with Address details
        /// </summary>
        [Fact]
        public async Task UTCID01_GetAddressByIdAsync_ValidAddressIdExists_ReturnsAddressResponse()
        {
            // Arrange
            CreateAddressService();

            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "123 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM",
                City = "TP.HCM",
                District = "Bình Thạnh",
                Ward = "25",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            // Act
            var result = await _addressService!.GetAddressByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var addressProp = resultType.GetProperty("Address");
            Assert.NotNull(addressProp);
            
            var addressValue = addressProp!.GetValue(result);
            Assert.NotNull(addressValue);
            
            var addressType = addressValue.GetType();
            var addressIdProp = addressType.GetProperty("AddressId");
            var latProp = addressType.GetProperty("Latitude");
            var lonProp = addressType.GetProperty("Longitude");
            var fullAddressProp = addressType.GetProperty("FullAddress");
            
            Assert.NotNull(addressIdProp);
            Assert.NotNull(latProp);
            Assert.NotNull(lonProp);
            Assert.NotNull(fullAddressProp);
            
            Assert.Equal(1, addressIdProp!.GetValue(addressValue));
            Assert.Equal(10.762622m, latProp!.GetValue(addressValue));
            Assert.Equal(106.660172m, lonProp!.GetValue(addressValue));
            Assert.NotNull(fullAddressProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID02: Abnormal case - Invalid AddressId that doesn't exist
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID02_GetAddressByIdAsync_InvalidAddressIdNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            CreateAddressService();

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Address?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _addressService!.GetAddressByIdAsync(999));

            Assert.Equal("Không tìm thấy địa chỉ", exception.Message);
        }

        #endregion
    }
}
