using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.AttributeOptionServiceTest
{
    public class UpdateOptionAsyncTest
    {
        private readonly Mock<IAttributeOptionRepository> _mockOptionRepository;
        private readonly AttributeOptionService _service;

        public UpdateOptionAsyncTest()
        {
            _mockOptionRepository = new Mock<IAttributeOptionRepository>();
            _service = new AttributeOptionService(_mockOptionRepository.Object, null!);
        }

        /// <summary>
        /// UTCID01: Valid option exists (not deleted) and valid name.
        /// Expected: Returns true and UpdateAsync called once.
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdateOptionAsync_ValidOption_ReturnsTrue()
        {
            // Arrange
            const int optionId = 1;
            const string newName = " New Name ";
            var option = new AttributeOption
            {
                OptionId = optionId,
                AttributeId = 10,
                Name = "Old",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _mockOptionRepository
                .Setup(r => r.GetByIdAsync(optionId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(option);

            _mockOptionRepository
                .Setup(r => r.UpdateAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.UpdateOptionAsync(optionId, newName);

            // Assert
            Assert.True(result);
            Assert.Equal(newName.Trim(), option.Name);
            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.Is<AttributeOption>(o =>
                    o.OptionId == optionId &&
                    o.Name == newName.Trim()),
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Option not found.
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdateOptionAsync_OptionNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int missingId = 999;
            _mockOptionRepository
                .Setup(r => r.GetByIdAsync(missingId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((AttributeOption?)null);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdateOptionAsync(missingId, "Any"));

            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Invalid optionId (0 or negative).
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdateOptionAsync_InvalidId_ThrowsKeyNotFoundException()
        {
            const int invalidId = 0;

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdateOptionAsync(invalidId, "Any"));

            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Option exists but marked deleted.
        /// Expected: Throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdateOptionAsync_OptionDeleted_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int optionId = 2;
            var option = new AttributeOption
            {
                OptionId = optionId,
                AttributeId = 11,
                Name = "Size",
                IsDeleted = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _mockOptionRepository
                .Setup(r => r.GetByIdAsync(optionId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(option);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdateOptionAsync(optionId, "Updated"));

            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID05: Option name is null/empty/whitespace.
        /// Expected: Throws ArgumentException.
        /// </summary>
        [Fact]
        public async Task UTCID05_UpdateOptionAsync_InvalidName_ThrowsArgumentException()
        {
            // Arrange
            const int optionId = 3;
            var option = new AttributeOption
            {
                OptionId = optionId,
                AttributeId = 12,
                Name = "Pattern",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _mockOptionRepository
                .Setup(r => r.GetByIdAsync(optionId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(option);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _service.UpdateOptionAsync(optionId, "   "));

            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }
    }
}

