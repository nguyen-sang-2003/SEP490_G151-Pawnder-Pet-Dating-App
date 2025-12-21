using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Tests.Services.AttributeOptionServiceTest
{
    public class GetOptionsByAttributeIdAsyncTest : IDisposable
    {
        private readonly Mock<IAttributeOptionRepository> _mockOptionRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly AttributeOptionService _service;

        public GetOptionsByAttributeIdAsyncTest()
        {
            _mockOptionRepository = new Mock<IAttributeOptionRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"AttributeOptionDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new AttributeOptionService(_mockOptionRepository.Object, _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: Valid attribute exists and is not deleted, options exist.
        /// Expected: Returns list of options.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetOptionsByAttributeIdAsync_ValidAttribute_ReturnsOptions()
        {
            // Arrange
            const int attributeId = 1;
            _context.Attributes.Add(new AttributeEntity
            {
                AttributeId = attributeId,
                Name = "Color",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var expectedOptions = new List<object>
            {
                new OptionResponse { OptionId = 10, AttributeId = attributeId, Name = "Red", IsDeleted = false },
                new OptionResponse { OptionId = 11, AttributeId = attributeId, Name = "Blue", IsDeleted = false }
            };

            _mockOptionRepository
                .Setup(r => r.GetOptionsByAttributeIdAsync(attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedOptions);

            // Act
            var result = await _service.GetOptionsByAttributeIdAsync(attributeId);

            // Assert
            var resultList = result.ToList();
            Assert.NotNull(resultList);
            Assert.Equal(expectedOptions.Count, resultList.Count);
            _mockOptionRepository.Verify(
                r => r.GetOptionsByAttributeIdAsync(attributeId, It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Attribute does not exist.
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetOptionsByAttributeIdAsync_AttributeNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int missingAttributeId = 999;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetOptionsByAttributeIdAsync(missingAttributeId));

            Assert.Equal("Không tìm thấy attribute tương ứng.", exception.Message);
            _mockOptionRepository.Verify(
                r => r.GetOptionsByAttributeIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Invalid attributeId value (negative).
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetOptionsByAttributeIdAsync_InvalidId_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int invalidAttributeId = -1;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetOptionsByAttributeIdAsync(invalidAttributeId));

            Assert.Equal("Không tìm thấy attribute tương ứng.", exception.Message);
            _mockOptionRepository.Verify(
                r => r.GetOptionsByAttributeIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Attribute exists but is marked as deleted.
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetOptionsByAttributeIdAsync_AttributeDeleted_ThrowsKeyNotFoundException()
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
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetOptionsByAttributeIdAsync(attributeId));

            Assert.Equal("Không tìm thấy attribute tương ứng.", exception.Message);
            _mockOptionRepository.Verify(
                r => r.GetOptionsByAttributeIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID05: Attribute exists and is not deleted but has no options.
        /// Expected: Returns an empty list.
        /// </summary>
        [Fact]
        public async Task UTCID05_GetOptionsByAttributeIdAsync_NoOptions_ReturnsEmptyList()
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

            _mockOptionRepository
                .Setup(r => r.GetOptionsByAttributeIdAsync(attributeId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<object>());

            // Act
            var result = await _service.GetOptionsByAttributeIdAsync(attributeId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
            _mockOptionRepository.Verify(
                r => r.GetOptionsByAttributeIdAsync(attributeId, It.IsAny<CancellationToken>()),
                Times.Once);
        }
    }
}

