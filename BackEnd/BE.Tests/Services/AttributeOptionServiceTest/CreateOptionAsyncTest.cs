using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Tests.Services.AttributeOptionServiceTest
{
    public class CreateOptionAsyncTest : IDisposable
    {
        private readonly Mock<IAttributeOptionRepository> _mockOptionRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly AttributeOptionService _service;

        public CreateOptionAsyncTest()
        {
            _mockOptionRepository = new Mock<IAttributeOptionRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"CreateOptionDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new AttributeOptionService(_mockOptionRepository.Object, _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: Valid attribute exists (not deleted) and valid option name.
        /// Expected: Returns message success and repository AddAsync called once.
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateOptionAsync_ValidAttributeAndName_ReturnsSuccess()
        {
            // Arrange
            const int attributeId = 1;
            const string optionName = " Color ";
            _context.Attributes.Add(new AttributeEntity
            {
                AttributeId = attributeId,
                Name = "Color",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            _mockOptionRepository
                .Setup(r => r.AddAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()))
                .Returns((AttributeOption entity, CancellationToken _) => Task.FromResult(entity));

            // Act
            var result = await _service.CreateOptionAsync(attributeId, optionName);

            // Assert
            var messageProp = result.GetType().GetProperty("message");
            Assert.NotNull(messageProp);
            Assert.Equal("Tạo option thành công.", messageProp!.GetValue(result));

            _mockOptionRepository.Verify(
                r => r.AddAsync(It.Is<AttributeOption>(o =>
                    o.AttributeId == attributeId &&
                    o.Name == optionName.Trim() &&
                    o.IsDeleted == false),
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Attribute not found.
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateOptionAsync_AttributeNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int missingAttributeId = 999;

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateOptionAsync(missingAttributeId, "Any"));

            Assert.Equal("Không tìm thấy attribute tương ứng.", ex.Message);
            _mockOptionRepository.Verify(
                r => r.AddAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Invalid attributeId value (0 or negative).
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateOptionAsync_InvalidAttributeId_ThrowsKeyNotFoundException()
        {
            const int invalidId = 0;

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateOptionAsync(invalidId, "Any"));

            Assert.Equal("Không tìm thấy attribute tương ứng.", ex.Message);
            _mockOptionRepository.Verify(
                r => r.AddAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Attribute exists but marked deleted.
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID04_CreateOptionAsync_AttributeDeleted_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int attributeId = 2;
            _context.Attributes.Add(new AttributeEntity
            {
                AttributeId = attributeId,
                Name = "Size",
                IsDeleted = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateOptionAsync(attributeId, "Large"));

            Assert.Equal("Không tìm thấy attribute tương ứng.", ex.Message);
            _mockOptionRepository.Verify(
                r => r.AddAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID05: Option name null/empty/whitespace.
        /// Expected: Throws ArgumentException.
        /// </summary>
        [Fact]
        public async Task UTCID05_CreateOptionAsync_InvalidName_ThrowsArgumentException()
        {
            // Arrange
            const int attributeId = 3;
            _context.Attributes.Add(new AttributeEntity
            {
                AttributeId = attributeId,
                Name = "Pattern",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateOptionAsync(attributeId, "   "));

            Assert.Equal("Tên option không được để trống.", ex.Message);
            _mockOptionRepository.Verify(
                r => r.AddAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }
    }
}

