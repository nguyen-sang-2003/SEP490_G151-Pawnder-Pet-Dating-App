using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetCharacteristicServiceTest
{
    public class UpdatePetCharacteristicAsyncTest : IDisposable
    {
        private readonly Mock<IPetCharacteristicRepository> _mockPetCharacteristicRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetCharacteristicService _petCharacteristicService;

        public UpdatePetCharacteristicAsyncTest()
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
        /// UTCID01: Normal case - Valid petId, Value > 0, OptionId null
        /// Condition: PetId valid (exists), Value has value (> 0), OptionId null, GetPetCharacteristicAsync returns entity
        /// Expected: Return object (success response)
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdatePetCharacteristicAsync_ValidPetWithNumericValue_ReturnsSuccessResponse()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Weight",
                TypeValue = "numeric",
                Unit = "kg",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var petChar = new PetCharacteristic
            {
                PetId = petId,
                AttributeId = attributeId,
                Value = 10,
                OptionId = null,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Attribute = attribute
            };

            var dto = new PetCharacteristicDTO
            {
                Value = 15,  // Value > 0
                OptionId = null
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.GetPetCharacteristicAsync(petId, attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(petChar);

            _mockPetCharacteristicRepository
                .Setup(r => r.UpdateAsync(It.IsAny<PetCharacteristic>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _petCharacteristicService.UpdatePetCharacteristicAsync(petId, attributeId, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.Equal(attributeId, resultType.GetProperty("attributeId")?.GetValue(result));
            Assert.Equal("Weight", resultType.GetProperty("name")?.GetValue(result));
            Assert.Equal(15, resultType.GetProperty("value")?.GetValue(result));
            Assert.Null(resultType.GetProperty("optionValue")?.GetValue(result));
        }

        /// <summary>
        /// UTCID02: Normal case - Valid petId, Value null, OptionId > 0 (valid), AttributeOption exists
        /// Condition: PetId valid (exists), Value null, OptionId has value (> 0), AttributeOption exists (valid)
        /// Expected: Return object (success response)
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdatePetCharacteristicAsync_ValidPetWithOptionId_ReturnsSuccessResponse()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Color",
                TypeValue = "option",
                Unit = null,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var petChar = new PetCharacteristic
            {
                PetId = petId,
                AttributeId = attributeId,
                Value = null,
                OptionId = null,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Attribute = attribute
            };

            var attributeOption = new AttributeOption
            {
                OptionId = 1,
                AttributeId = attributeId,
                Name = "Black",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.AttributeOptions.Add(attributeOption);
            await _context.SaveChangesAsync();

            var dto = new PetCharacteristicDTO
            {
                Value = null,
                OptionId = 1  // OptionId > 0
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.GetPetCharacteristicAsync(petId, attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(petChar);

            _mockPetCharacteristicRepository
                .Setup(r => r.UpdateAsync(It.IsAny<PetCharacteristic>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _petCharacteristicService.UpdatePetCharacteristicAsync(petId, attributeId, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.Equal(attributeId, resultType.GetProperty("attributeId")?.GetValue(result));
            Assert.Equal("Color", resultType.GetProperty("name")?.GetValue(result));
            Assert.Null(resultType.GetProperty("value")?.GetValue(result));
            Assert.Equal("Black", resultType.GetProperty("optionValue")?.GetValue(result));
        }

        /// <summary>
        /// UTCID03: Normal case - Valid petId, Value = 0 (treated as null)
        /// Condition: PetId valid (exists), Value = 0 (treated as null), GetPetCharacteristicAsync returns entity
        /// Expected: Return object (success response) with value = null
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdatePetCharacteristicAsync_ValueZeroTreatedAsNull_ReturnsSuccessResponse()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Weight",
                TypeValue = "numeric",
                Unit = "kg",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var petChar = new PetCharacteristic
            {
                PetId = petId,
                AttributeId = attributeId,
                Value = 10,
                OptionId = null,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Attribute = attribute
            };

            var dto = new PetCharacteristicDTO
            {
                Value = 0,  // Value = 0, treated as null
                OptionId = null
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.GetPetCharacteristicAsync(petId, attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(petChar);

            _mockPetCharacteristicRepository
                .Setup(r => r.UpdateAsync(It.IsAny<PetCharacteristic>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _petCharacteristicService.UpdatePetCharacteristicAsync(petId, attributeId, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.Equal(attributeId, resultType.GetProperty("attributeId")?.GetValue(result));
            Assert.Null(resultType.GetProperty("value")?.GetValue(result));  // Value = 0 treated as null
        }

        /// <summary>
        /// UTCID04: Normal case - Valid petId, Value null, OptionId = 0 (treated as null)
        /// Condition: PetId valid (exists), Value null, OptionId = 0 (treated as null), GetPetCharacteristicAsync returns entity
        /// Expected: Return object (success response) with optionValue = null
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdatePetCharacteristicAsync_OptionIdZeroTreatedAsNull_ReturnsSuccessResponse()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Color",
                TypeValue = "option",
                Unit = null,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var petChar = new PetCharacteristic
            {
                PetId = petId,
                AttributeId = attributeId,
                Value = null,
                OptionId = 1,  // Có optionId ban đầu
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Attribute = attribute
            };

            var dto = new PetCharacteristicDTO
            {
                Value = null,
                OptionId = 0  // OptionId = 0, treated as null
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.GetPetCharacteristicAsync(petId, attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(petChar);

            _mockPetCharacteristicRepository
                .Setup(r => r.UpdateAsync(It.IsAny<PetCharacteristic>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _petCharacteristicService.UpdatePetCharacteristicAsync(petId, attributeId, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.Equal(attributeId, resultType.GetProperty("attributeId")?.GetValue(result));
            Assert.Null(resultType.GetProperty("value")?.GetValue(result));
            Assert.Null(resultType.GetProperty("optionValue")?.GetValue(result));  // OptionId = 0 treated as null
        }

        #endregion
    }
}
