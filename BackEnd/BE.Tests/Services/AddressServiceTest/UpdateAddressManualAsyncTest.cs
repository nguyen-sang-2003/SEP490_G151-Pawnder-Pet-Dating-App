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
    public class UpdateAddressManualAsyncTest : IDisposable
    {
        private readonly Mock<IAddressRepository> _mockAddressRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<IMemoryCache> _mockCache;
        private AddressService? _addressService;

        public UpdateAddressManualAsyncTest()
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
        /// UTCID01: Normal case - Valid address, City/District/Ward all provided
        /// Expected: All fields updated, FullAddress updated with all parts
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdateAddressManualAsync_AllFieldsProvided_UpdatesAllFields()
        {
            // Arrange
            CreateAddressService();

            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "Old Address",
                City = "Old City",
                District = "Old District",
                Ward = "Old Ward",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified)
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var dto = new ManualAddressDto
            {
                City = "New City",
                District = "New District",
                Ward = "New Ward"
            };

            // Act
            var result = await _addressService!.UpdateAddressManualAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var messageProp = resultType.GetProperty("message");
            var addressProp = resultType.GetProperty("Address");
            
            Assert.NotNull(messageProp);
            Assert.Equal("Cập nhật địa chỉ thành công", messageProp!.GetValue(result));
            
            Assert.NotNull(addressProp);
            var addressValue = addressProp!.GetValue(result);
            var addressType = addressValue!.GetType();
            
            var cityProp = addressType.GetProperty("City");
            var districtProp = addressType.GetProperty("District");
            var wardProp = addressType.GetProperty("Ward");
            var fullAddressProp = addressType.GetProperty("FullAddress");
            
            Assert.Equal("New City", cityProp!.GetValue(addressValue));
            Assert.Equal("New District", districtProp!.GetValue(addressValue));
            Assert.Equal("New Ward", wardProp!.GetValue(addressValue));
            Assert.Equal("New Ward, New District, New City", fullAddressProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID02: Normal case - Valid address, City/Ward provided, District empty
        /// Expected: City/Ward updated, District unchanged, FullAddress updated without District
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdateAddressManualAsync_CityWardProvided_UpdatesCityWardKeepsDistrict()
        {
            // Arrange
            CreateAddressService();

            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "Old Address",
                City = "Old City",
                District = "Existing District",
                Ward = "Old Ward",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified)
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var dto = new ManualAddressDto
            {
                City = "New City",
                District = null, // Empty
                Ward = "New Ward"
            };

            // Act
            var result = await _addressService!.UpdateAddressManualAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var addressProp = resultType.GetProperty("Address");
            var addressValue = addressProp!.GetValue(result);
            var addressType = addressValue!.GetType();
            
            var cityProp = addressType.GetProperty("City");
            var districtProp = addressType.GetProperty("District");
            var wardProp = addressType.GetProperty("Ward");
            var fullAddressProp = addressType.GetProperty("FullAddress");
            
            Assert.Equal("New City", cityProp!.GetValue(addressValue));
            Assert.Equal("Existing District", districtProp!.GetValue(addressValue)); // Unchanged
            Assert.Equal("New Ward", wardProp!.GetValue(addressValue));
            Assert.Equal("New Ward, Existing District, New City", fullAddressProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID03: Abnormal case - Valid address, all fields empty
        /// Expected: All fields unchanged, FullAddress generated from empty values
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdateAddressManualAsync_AllFieldsEmpty_NoUpdatesButMessageReturned()
        {
            // Arrange
            CreateAddressService();

            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "Original Address",
                City = "Original City",
                District = "Original District",
                Ward = "Original Ward",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified)
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var dto = new ManualAddressDto
            {
                City = null,
                District = null,
                Ward = null
            };

            // Act
            var result = await _addressService!.UpdateAddressManualAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var messageProp = resultType.GetProperty("message");
            var addressProp = resultType.GetProperty("Address");
            
            Assert.Equal("Cập nhật địa chỉ thành công", messageProp!.GetValue(result));
            
            var addressValue = addressProp!.GetValue(result);
            var addressType = addressValue!.GetType();
            
            var cityProp = addressType.GetProperty("City");
            var districtProp = addressType.GetProperty("District");
            var wardProp = addressType.GetProperty("Ward");
            
            // Fields should remain unchanged
            Assert.Equal("Original City", cityProp!.GetValue(addressValue));
            Assert.Equal("Original District", districtProp!.GetValue(addressValue));
            Assert.Equal("Original Ward", wardProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID04: Normal case - Valid address, City provided, District/Ward empty
        /// Expected: City updated, District/Ward unchanged
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdateAddressManualAsync_OnlyCityProvided_UpdatesCityKeepsOthers()
        {
            // Arrange
            CreateAddressService();

            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "Old Address",
                City = "Old City",
                District = "Existing District",
                Ward = "Existing Ward",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified)
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var dto = new ManualAddressDto
            {
                City = "New City",
                District = null,
                Ward = null
            };

            // Act
            var result = await _addressService!.UpdateAddressManualAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var addressProp = resultType.GetProperty("Address");
            var addressValue = addressProp!.GetValue(result);
            var addressType = addressValue!.GetType();
            
            var cityProp = addressType.GetProperty("City");
            var districtProp = addressType.GetProperty("District");
            var wardProp = addressType.GetProperty("Ward");
            
            Assert.Equal("New City", cityProp!.GetValue(addressValue));
            Assert.Equal("Existing District", districtProp!.GetValue(addressValue));
            Assert.Equal("Existing Ward", wardProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID05: Normal case - Valid address, Ward provided, City/District empty
        /// Expected: Ward updated, City/District unchanged
        /// </summary>
        [Fact]
        public async Task UTCID05_UpdateAddressManualAsync_OnlyWardProvided_UpdatesWardKeepsOthers()
        {
            // Arrange
            CreateAddressService();

            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "Old Address",
                City = "Existing City",
                District = "Existing District",
                Ward = "Old Ward",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified)
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var dto = new ManualAddressDto
            {
                City = null,
                District = null,
                Ward = "New Ward"
            };

            // Act
            var result = await _addressService!.UpdateAddressManualAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var addressProp = resultType.GetProperty("Address");
            var addressValue = addressProp!.GetValue(result);
            var addressType = addressValue!.GetType();
            
            var cityProp = addressType.GetProperty("City");
            var districtProp = addressType.GetProperty("District");
            var wardProp = addressType.GetProperty("Ward");
            
            Assert.Equal("Existing City", cityProp!.GetValue(addressValue));
            Assert.Equal("Existing District", districtProp!.GetValue(addressValue));
            Assert.Equal("New Ward", wardProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID06: Normal case - Valid address, City/District provided, Ward empty
        /// Expected: City/District updated, Ward unchanged
        /// </summary>
        [Fact]
        public async Task UTCID06_UpdateAddressManualAsync_CityDistrictProvided_UpdatesBothKeepsWard()
        {
            // Arrange
            CreateAddressService();

            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "Old Address",
                City = "Old City",
                District = "Old District",
                Ward = "Existing Ward",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified)
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var dto = new ManualAddressDto
            {
                City = "New City",
                District = "New District",
                Ward = null
            };

            // Act
            var result = await _addressService!.UpdateAddressManualAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var addressProp = resultType.GetProperty("Address");
            var addressValue = addressProp!.GetValue(result);
            var addressType = addressValue!.GetType();
            
            var cityProp = addressType.GetProperty("City");
            var districtProp = addressType.GetProperty("District");
            var wardProp = addressType.GetProperty("Ward");
            
            Assert.Equal("New City", cityProp!.GetValue(addressValue));
            Assert.Equal("New District", districtProp!.GetValue(addressValue));
            Assert.Equal("Existing Ward", wardProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID07: Normal case - Valid address, City/Ward provided, District empty
        /// Expected: City/Ward updated, District unchanged
        /// </summary>
        [Fact]
        public async Task UTCID07_UpdateAddressManualAsync_CityWardProvidedDistrictEmpty_UpdatesCityWardKeepsDistrict()
        {
            // Arrange
            CreateAddressService();

            var address = new Address
            {
                AddressId = 1,
                Latitude = 10.762622m,
                Longitude = 106.660172m,
                FullAddress = "Old Address",
                City = "Old City",
                District = "Existing District",
                Ward = "Old Ward",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified)
            };

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(address);

            _mockAddressRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Address>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var dto = new ManualAddressDto
            {
                City = "New City",
                District = "",
                Ward = "New Ward"
            };

            // Act
            var result = await _addressService!.UpdateAddressManualAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var addressProp = resultType.GetProperty("Address");
            var addressValue = addressProp!.GetValue(result);
            var addressType = addressValue!.GetType();
            
            var cityProp = addressType.GetProperty("City");
            var districtProp = addressType.GetProperty("District");
            var wardProp = addressType.GetProperty("Ward");
            
            Assert.Equal("New City", cityProp!.GetValue(addressValue));
            Assert.Equal("Existing District", districtProp!.GetValue(addressValue));
            Assert.Equal("New Ward", wardProp!.GetValue(addressValue));
        }

        /// <summary>
        /// UTCID08: Abnormal case - Invalid AddressId that doesn't exist
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID08_UpdateAddressManualAsync_InvalidAddressId_ThrowsKeyNotFoundException()
        {
            // Arrange
            CreateAddressService();

            _mockAddressRepository
                .Setup(r => r.GetAddressByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Address?)null);

            var dto = new ManualAddressDto
            {
                City = "New City",
                District = "New District",
                Ward = "New Ward"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _addressService!.UpdateAddressManualAsync(999, dto));

            Assert.Equal("Không tìm thấy địa chỉ", exception.Message);
        }

        #endregion
    }
}
