using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetCharacteristicServiceTest
{
    public class CreatePetCharacteristicAsyncTest : IDisposable
    {
        private readonly Mock<IPetCharacteristicRepository> _mockPetCharacteristicRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetCharacteristicService _petCharacteristicService;

        public CreatePetCharacteristicAsyncTest()
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
        /// UTCID01: Normal case - Valid pet, valid attribute, not deleted, doesn't exist, has OptionId
        /// Condition: PetId valid, Pet IsDeleted=FALSE, AttributeId valid, Attribute IsDeleted=FALSE, 
        ///            Characteristic doesn't exist, OptionId has value
        /// Expected: Return object (success response) with properties (attributeId, name, typeValue, unit, value, optionValue)
        /// </summary>
        [Fact]
        public async Task UTCID01_CreatePetCharacteristicAsync_ValidPetValidAttributeWithOptionId_ReturnsSuccessResponse()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);

            var attributeOption = new AttributeOption
            {
                OptionId = 1,
                AttributeId = attributeId,
                Name = "Black",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Color",
                TypeValue = "option",
                Unit = null,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                AttributeOptions = new List<AttributeOption> { attributeOption }
            };
            _context.Attributes.Add(attribute);
            await _context.SaveChangesAsync();

            var dto = new PetCharacteristicDTO
            {
                OptionId = 1,
                Value = null
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.ExistsAsync(petId, attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            _mockPetCharacteristicRepository
                .Setup(r => r.AddAsync(It.IsAny<PetCharacteristic>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((PetCharacteristic pc, CancellationToken ct) => pc);

            // Act
            var result = await _petCharacteristicService.CreatePetCharacteristicAsync(petId, attributeId, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.Equal(attributeId, resultType.GetProperty("attributeId")?.GetValue(result));
            Assert.Equal("Color", resultType.GetProperty("name")?.GetValue(result));
            Assert.Equal("option", resultType.GetProperty("typeValue")?.GetValue(result));
            Assert.Null(resultType.GetProperty("unit")?.GetValue(result));
            Assert.Equal("Black", resultType.GetProperty("optionValue")?.GetValue(result));
        }

        /// <summary>
        /// UTCID02: Normal case - Valid pet, valid attribute, not deleted, doesn't exist, OptionId null (numeric value)
        /// Condition: PetId valid, Pet IsDeleted=FALSE, AttributeId valid, Attribute IsDeleted=FALSE, 
        ///            Characteristic doesn't exist, OptionId null
        /// Expected: Return object (success response) with properties (attributeId, name, typeValue, unit, value, optionValue null)
        /// </summary>
        [Fact]
        public async Task UTCID02_CreatePetCharacteristicAsync_ValidPetValidAttributeWithNumericValue_ReturnsSuccessResponse()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Weight",
                TypeValue = "numeric",
                Unit = "kg",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                AttributeOptions = new List<AttributeOption>()
            };
            _context.Attributes.Add(attribute);
            await _context.SaveChangesAsync();

            var dto = new PetCharacteristicDTO
            {
                OptionId = null,
                Value = 15
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.ExistsAsync(petId, attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            _mockPetCharacteristicRepository
                .Setup(r => r.AddAsync(It.IsAny<PetCharacteristic>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((PetCharacteristic pc, CancellationToken ct) => pc);

            // Act
            var result = await _petCharacteristicService.CreatePetCharacteristicAsync(petId, attributeId, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.Equal(attributeId, resultType.GetProperty("attributeId")?.GetValue(result));
            Assert.Equal("Weight", resultType.GetProperty("name")?.GetValue(result));
            Assert.Equal("numeric", resultType.GetProperty("typeValue")?.GetValue(result));
            Assert.Equal("kg", resultType.GetProperty("unit")?.GetValue(result));
            Assert.Equal(15, resultType.GetProperty("value")?.GetValue(result));
            Assert.Null(resultType.GetProperty("optionValue")?.GetValue(result));
        }

        /// <summary>
        /// UTCID03: Abnormal case - Valid pet but Pet IsDeleted = TRUE
        /// Condition: PetId valid (exists), Pet IsDeleted = TRUE
        /// Expected: Throw KeyNotFoundException (Pet)
        /// </summary>
        [Fact]
        public async Task UTCID03_CreatePetCharacteristicAsync_PetIsDeleted_ThrowsKeyNotFoundException()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = true,  // Pet đã bị xóa
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);
            await _context.SaveChangesAsync();

            var dto = new PetCharacteristicDTO
            {
                OptionId = null,
                Value = 15
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petCharacteristicService.CreatePetCharacteristicAsync(petId, attributeId, dto));

            Assert.Contains("Pet không tồn tại", exception.Message);
        }

        /// <summary>
        /// UTCID04: Abnormal case - PetId invalid (not exists)
        /// Condition: PetId invalid (not exists), FindAsync returns null
        /// Expected: Throw KeyNotFoundException (Pet)
        /// </summary>
        [Fact]
        public async Task UTCID04_CreatePetCharacteristicAsync_PetNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int invalidPetId = 999;
            int attributeId = 1;

            var dto = new PetCharacteristicDTO
            {
                OptionId = null,
                Value = 15
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petCharacteristicService.CreatePetCharacteristicAsync(invalidPetId, attributeId, dto));

            Assert.Contains("Pet không tồn tại", exception.Message);
        }

        /// <summary>
        /// UTCID05: Abnormal case - Valid pet, AttributeId invalid (not exists)
        /// Condition: PetId valid, Pet IsDeleted=FALSE, AttributeId invalid
        /// Expected: Throw KeyNotFoundException (Attribute)
        /// </summary>
        [Fact]
        public async Task UTCID05_CreatePetCharacteristicAsync_AttributeNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int petId = 1;
            int invalidAttributeId = 999;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);
            await _context.SaveChangesAsync();

            var dto = new PetCharacteristicDTO
            {
                OptionId = null,
                Value = 15
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petCharacteristicService.CreatePetCharacteristicAsync(petId, invalidAttributeId, dto));

            Assert.Contains("Attribute không tồn tại", exception.Message);
        }

        /// <summary>
        /// UTCID06: Abnormal case - Valid pet, valid attribute but Attribute IsDeleted = TRUE
        /// Condition: PetId valid, Pet IsDeleted=FALSE, AttributeId valid, Attribute IsDeleted=TRUE
        /// Expected: Throw KeyNotFoundException (Attribute)
        /// </summary>
        [Fact]
        public async Task UTCID06_CreatePetCharacteristicAsync_AttributeIsDeleted_ThrowsKeyNotFoundException()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Weight",
                TypeValue = "numeric",
                Unit = "kg",
                IsDeleted = true,  // Attribute đã bị xóa
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                AttributeOptions = new List<AttributeOption>()
            };
            _context.Attributes.Add(attribute);
            await _context.SaveChangesAsync();

            var dto = new PetCharacteristicDTO
            {
                OptionId = null,
                Value = 15
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petCharacteristicService.CreatePetCharacteristicAsync(petId, attributeId, dto));

            Assert.Contains("Attribute không tồn tại", exception.Message);
        }

        /// <summary>
        /// UTCID07: Abnormal case - Valid pet, valid attribute, but characteristic already exists
        /// Condition: PetId valid, Pet IsDeleted=FALSE, AttributeId valid, Attribute IsDeleted=FALSE, 
        ///            Characteristic already exists = TRUE, ExistsAsync returns true
        /// Expected: Throw InvalidOperationException
        /// </summary>
        [Fact]
        public async Task UTCID07_CreatePetCharacteristicAsync_CharacteristicAlreadyExists_ThrowsInvalidOperationException()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Weight",
                TypeValue = "numeric",
                Unit = "kg",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                AttributeOptions = new List<AttributeOption>()
            };
            _context.Attributes.Add(attribute);
            await _context.SaveChangesAsync();

            var dto = new PetCharacteristicDTO
            {
                OptionId = null,
                Value = 15
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.ExistsAsync(petId, attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);  // Đặc điểm đã tồn tại

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _petCharacteristicService.CreatePetCharacteristicAsync(petId, attributeId, dto));

            Assert.Contains("Đặc điểm này đã tồn tại cho pet", exception.Message);
        }

        /// <summary>
        /// UTCID08: Normal case - Valid pet, valid attribute, not deleted, doesn't exist (another success case)
        /// Condition: PetId valid, Pet IsDeleted=FALSE, AttributeId valid, Attribute IsDeleted=FALSE, 
        ///            Characteristic doesn't exist
        /// Expected: Return object (success response)
        /// </summary>
        [Fact]
        public async Task UTCID08_CreatePetCharacteristicAsync_ValidPetValidAttribute_ReturnsSuccessResponse()
        {
            // Arrange
            int petId = 1;
            int attributeId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "Max",
                Breed = "Labrador",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);

            var attribute = new BE.Models.Attribute
            {
                AttributeId = attributeId,
                Name = "Height",
                TypeValue = "numeric",
                Unit = "cm",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                AttributeOptions = new List<AttributeOption>()
            };
            _context.Attributes.Add(attribute);
            await _context.SaveChangesAsync();

            var dto = new PetCharacteristicDTO
            {
                OptionId = null,
                Value = 50
            };

            _mockPetCharacteristicRepository
                .Setup(r => r.ExistsAsync(petId, attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            _mockPetCharacteristicRepository
                .Setup(r => r.AddAsync(It.IsAny<PetCharacteristic>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((PetCharacteristic pc, CancellationToken ct) => pc);

            // Act
            var result = await _petCharacteristicService.CreatePetCharacteristicAsync(petId, attributeId, dto);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.Equal(attributeId, resultType.GetProperty("attributeId")?.GetValue(result));
            Assert.Equal("Height", resultType.GetProperty("name")?.GetValue(result));
            Assert.Equal("numeric", resultType.GetProperty("typeValue")?.GetValue(result));
            Assert.Equal("cm", resultType.GetProperty("unit")?.GetValue(result));
            Assert.Equal(50, resultType.GetProperty("value")?.GetValue(result));
        }

        #endregion
    }
}
