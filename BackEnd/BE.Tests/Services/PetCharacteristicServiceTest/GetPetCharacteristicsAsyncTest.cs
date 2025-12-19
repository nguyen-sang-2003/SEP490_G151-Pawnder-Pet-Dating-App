using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetCharacteristicServiceTest
{
    public class GetPetCharacteristicsAsyncTest : IDisposable
    {
        private readonly Mock<IPetCharacteristicRepository> _mockPetCharacteristicRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetCharacteristicService _petCharacteristicService;

        public GetPetCharacteristicsAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockPetCharacteristicRepository = new Mock<IPetCharacteristicRepository>();

            // Create real InMemory DbContext
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Khởi tạo service
            _petCharacteristicService = new PetCharacteristicService(
                _mockPetCharacteristicRepository.Object,
                _context
            );
        }

        public void Dispose()
        {
            _context?.Dispose();
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid PetId, repository returns multiple items with numeric and option values
        /// Condition: PetId valid (exists), Repository returns multiple items, Characteristics include numeric value and option value
        /// Expected: Return IEnumerable<object> with items, response item properties verified (attributeId, name, optionValue, value, unit)
        /// </summary>
        [Fact]
        public async Task UTCID01_GetPetCharacteristicsAsync_ValidPetMultipleItemsWithNumericAndOption_ReturnsItemsWithProperties()
        {
            // Arrange
            int petId = 1;
            var characteristics = new List<object>
            {
                new
                {
                    attributeId = 1,
                    name = "Weight",
                    optionValue = (string?)null,
                    value = (int?)15,
                    unit = "kg",
                    typeValue = "numeric"
                },
                new
                {
                    attributeId = 2,
                    name = "Color",
                    optionValue = "Black",
                    value = (int?)null,
                    unit = (string?)null,
                    typeValue = "option"
                }
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.GetPetCharacteristicsAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(characteristics);

            // Act
            var result = await _petCharacteristicService.GetPetCharacteristicsAsync(petId);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);

            // Verify first item (numeric value - weight)
            dynamic item1 = resultList[0];
            Assert.Equal(1, item1.attributeId);
            Assert.Equal("Weight", item1.name);
            Assert.Null(item1.optionValue);
            Assert.Equal(15, item1.value);
            Assert.Equal("kg", item1.unit);

            // Verify second item (option value - color)
            dynamic item2 = resultList[1];
            Assert.Equal(2, item2.attributeId);
            Assert.Equal("Color", item2.name);
            Assert.Equal("Black", item2.optionValue);
            Assert.Null(item2.value);
        }

        /// <summary>
        /// UTCID02: Abnormal case - Invalid PetId (not exists)
        /// Condition: PetId invalid (not exists)
        /// Expected: Throw Exception
        /// </summary>
        [Fact]
        public async Task UTCID02_GetPetCharacteristicsAsync_InvalidPetId_ThrowsException()
        {
            // Arrange
            int invalidPetId = 999;

            _mockPetCharacteristicRepository
                .Setup(r => r.GetPetCharacteristicsAsync(invalidPetId, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new KeyNotFoundException("Pet không tồn tại."));

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petCharacteristicService.GetPetCharacteristicsAsync(invalidPetId));
        }

        /// <summary>
        /// UTCID03: Normal case - Valid PetId, repository returns empty list
        /// Condition: PetId valid (exists), Repository returns empty list
        /// Expected: Return IEnumerable<object> empty
        /// </summary>
        [Fact]
        public async Task UTCID03_GetPetCharacteristicsAsync_ValidPetEmptyList_ReturnsEmptyEnumerable()
        {
            // Arrange
            int petId = 1;
            var emptyList = new List<object>();

            _mockPetCharacteristicRepository
                .Setup(r => r.GetPetCharacteristicsAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(emptyList);

            // Act
            var result = await _petCharacteristicService.GetPetCharacteristicsAsync(petId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID04: Normal case - Valid PetId, repository returns multiple items with numeric value only (weight, height)
        /// Condition: PetId valid (exists), Repository returns multiple items, Characteristics include numeric value only
        /// Expected: Return IEnumerable<object> with items, response item properties verified (attributeId, name, optionValue null, value, unit)
        /// </summary>
        [Fact]
        public async Task UTCID04_GetPetCharacteristicsAsync_ValidPetMultipleItemsNumericOnly_ReturnsItemsWithProperties()
        {
            // Arrange
            int petId = 1;
            var characteristics = new List<object>
            {
                new
                {
                    attributeId = 1,
                    name = "Weight",
                    optionValue = (string?)null,
                    value = (int?)15,
                    unit = "kg",
                    typeValue = "numeric"
                },
                new
                {
                    attributeId = 3,
                    name = "Height",
                    optionValue = (string?)null,
                    value = (int?)50,
                    unit = "cm",
                    typeValue = "numeric"
                }
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.GetPetCharacteristicsAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(characteristics);

            // Act
            var result = await _petCharacteristicService.GetPetCharacteristicsAsync(petId);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);

            // Verify first item (weight)
            dynamic item1 = resultList[0];
            Assert.Equal(1, item1.attributeId);
            Assert.Equal("Weight", item1.name);
            Assert.Null(item1.optionValue);
            Assert.Equal(15, item1.value);
            Assert.Equal("kg", item1.unit);

            // Verify second item (height)
            dynamic item2 = resultList[1];
            Assert.Equal(3, item2.attributeId);
            Assert.Equal("Height", item2.name);
            Assert.Null(item2.optionValue);
            Assert.Equal(50, item2.value);
            Assert.Equal("cm", item2.unit);
        }

        #endregion
    }
}
