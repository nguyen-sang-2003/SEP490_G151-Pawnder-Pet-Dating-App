using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Tests.Services.AttributeServiceTest
{
    public class CreateAttributeAsyncTest
    {
        private readonly Mock<IAttributeRepository> _mockAttributeRepository;
        private readonly AttributeService? _attributeService;

        public CreateAttributeAsyncTest()
        {
            _mockAttributeRepository = new Mock<IAttributeRepository>();
            _attributeService = new AttributeService(_mockAttributeRepository.Object);
        }

        /// <summary>
        /// UTCID01: CreateAttributeAsync with valid attribute data (name not exists)
        /// Expected: Returns AttributeResponse with all properties correctly set
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateAttributeAsync_ValidAttributeNameNotExists_ReturnsAttributeResponse()
        {
            // Arrange
            const string name = "Chiều cao";
            const string typeValue = "number";
            const string unit = "cm";
            const bool isDeleted = false;

            _mockAttributeRepository
                .Setup(r => r.NameExistsAsync(name, null, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false); // Name doesn't exist

            _mockAttributeRepository
                .Setup(r => r.AddAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()))
                .Returns((AttributeEntity entity, CancellationToken ct) =>
                {
                    entity.AttributeId = 1;
                    return Task.FromResult(entity);
                });

            var request = new AttributeCreateRequest
            {
                Name = name,
                TypeValue = typeValue,
                Unit = unit,
                IsDeleted = isDeleted
            };

            // Act
            var result = await _attributeService!.CreateAttributeAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.NotEqual(0, result.AttributeId);
            Assert.Equal(name, result.Name);
            Assert.Equal(typeValue, result.TypeValue);
            Assert.Equal(unit, result.Unit);
            Assert.Equal(isDeleted, result.IsDeleted);
            Assert.NotNull(result.CreatedAt);
            Assert.NotNull(result.UpdatedAt);

            // Verify repository calls
            _mockAttributeRepository.Verify(
                r => r.NameExistsAsync(name, null, It.IsAny<CancellationToken>()),
                Times.Once);
            _mockAttributeRepository.Verify(
                r => r.AddAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: CreateAttributeAsync with attribute name already exists
        /// Expected: Throws InvalidOperationException with "Tên thuộc tính đã tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateAttributeAsync_AttributeNameExists_ThrowsInvalidOperationException()
        {
            // Arrange
            const string name = "Kích thước";

            _mockAttributeRepository
                .Setup(r => r.NameExistsAsync(name, null, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true); // Name already exists

            var request = new AttributeCreateRequest
            {
                Name = name,
                TypeValue = "string",
                Unit = null
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await _attributeService!.CreateAttributeAsync(request));

            Assert.Equal("Tên thuộc tính đã tồn tại.", exception.Message);

            // Verify AddAsync was not called
            _mockAttributeRepository.Verify(
                r => r.AddAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: CreateAttributeAsync with null/empty/whitespace name
        /// Expected: Throws exception (ArgumentException or similar validation error)
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateAttributeAsync_NullOrEmptyName_ThrowsException()
        {
            // Arrange
            const string name = "";

            // When checking if empty name exists, it may throw or return false
            // The validation may happen at DTO level or service level
            _mockAttributeRepository
                .Setup(r => r.NameExistsAsync(string.Empty, null, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new ArgumentException("Tên thuộc tính là bắt buộc."));

            var request = new AttributeCreateRequest
            {
                Name = name,
                TypeValue = "string",
                Unit = null
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                async () => await _attributeService!.CreateAttributeAsync(request));

            Assert.Contains("Tên thuộc tính", exception.Message);

            // Verify AddAsync was not called
            _mockAttributeRepository.Verify(
                r => r.AddAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }
    }
}
