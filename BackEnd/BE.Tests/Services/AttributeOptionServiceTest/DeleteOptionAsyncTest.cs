using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.AttributeOptionServiceTest
{
    public class DeleteOptionAsyncTest
    {
        private readonly Mock<IAttributeOptionRepository> _mockOptionRepository;
        private readonly AttributeOptionService _service;

        public DeleteOptionAsyncTest()
        {
            _mockOptionRepository = new Mock<IAttributeOptionRepository>();
            _service = new AttributeOptionService(_mockOptionRepository.Object, null!);
        }

        /// <summary>
        /// UTCID01: Option exists and not deleted.
        /// Expected: Returns true, sets IsDeleted and calls UpdateAsync.
        /// </summary>
        [Fact]
        public async Task UTCID01_DeleteOptionAsync_ValidOption_ReturnsTrue()
        {
            // Arrange
            const int optionId = 1;
            var option = new AttributeOption
            {
                OptionId = optionId,
                AttributeId = 10,
                Name = "Color",
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
            var result = await _service.DeleteOptionAsync(optionId);

            // Assert
            Assert.True(result);
            Assert.True(option.IsDeleted);
            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.Is<AttributeOption>(o =>
                    o.OptionId == optionId &&
                    o.IsDeleted == true),
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Option not found.
        /// Expected: Returns false, UpdateAsync not called.
        /// </summary>
        [Fact]
        public async Task UTCID02_DeleteOptionAsync_OptionNotFound_ReturnsFalse()
        {
            // Arrange
            const int missingId = 999;
            _mockOptionRepository
                .Setup(r => r.GetByIdAsync(missingId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((AttributeOption?)null);

            // Act
            var result = await _service.DeleteOptionAsync(missingId);

            // Assert
            Assert.False(result);
            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Invalid optionId (0).
        /// Expected: Returns false, UpdateAsync not called.
        /// </summary>
        [Fact]
        public async Task UTCID03_DeleteOptionAsync_InvalidId_ReturnsFalse()
        {
            // Act
            var result = await _service.DeleteOptionAsync(0);

            // Assert
            Assert.False(result);
            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Option exists but already deleted.
        /// Expected: Returns false, UpdateAsync not called.
        /// </summary>
        [Fact]
        public async Task UTCID04_DeleteOptionAsync_OptionAlreadyDeleted_ReturnsFalse()
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

            // Act
            var result = await _service.DeleteOptionAsync(optionId);

            // Assert
            Assert.False(result);
            _mockOptionRepository.Verify(
                r => r.UpdateAsync(It.IsAny<AttributeOption>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }
    }
}

