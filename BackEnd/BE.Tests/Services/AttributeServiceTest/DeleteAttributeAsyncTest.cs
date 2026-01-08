using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Tests.Services.AttributeServiceTest;

public class DeleteAttributeAsyncTest
{
    private readonly Mock<IAttributeRepository> _mockAttributeRepository;
    private readonly AttributeService _attributeService;

    public DeleteAttributeAsyncTest()
    {
        _mockAttributeRepository = new Mock<IAttributeRepository>();
        _attributeService = new AttributeService(_mockAttributeRepository.Object);
    }

    [Fact(DisplayName = "UTCID01: DeleteAttributeAsync with valid id (exists, not deleted) - Return true and soft delete")]
    public async Task DeleteAttributeAsync_WithValidId_ReturnsTrueAndSoftDeletes()
    {
        // Arrange
        int attributeId = 1;
        var attributeEntity = new AttributeEntity
        {
            AttributeId = 1,
            Name = "Color",
            TypeValue = "string",
            Unit = "N/A",
            IsDeleted = false,
            CreatedAt = new DateTime(2024, 1, 1, 10, 0, 0),
            UpdatedAt = new DateTime(2024, 1, 1, 10, 0, 0)
        };

        _mockAttributeRepository
            .Setup(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributeEntity);

        _mockAttributeRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _attributeService.DeleteAttributeAsync(attributeId, hard: false, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.DeleteAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact(DisplayName = "UTCID02: DeleteAttributeAsync with non-existent id (999) - Throw KeyNotFoundException")]
    public async Task DeleteAttributeAsync_WithNonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int attributeId = 999;
        _mockAttributeRepository
            .Setup(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AttributeEntity)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _attributeService.DeleteAttributeAsync(attributeId, hard: false, CancellationToken.None)
        );

        Assert.Equal("Không tìm thấy thuộc tính để xoá.", exception.Message);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockAttributeRepository.Verify(r => r.DeleteAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact(DisplayName = "UTCID03: DeleteAttributeAsync with invalid id (0) - Throw KeyNotFoundException")]
    public async Task DeleteAttributeAsync_WithInvalidId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int attributeId = 0;
        _mockAttributeRepository
            .Setup(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AttributeEntity)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _attributeService.DeleteAttributeAsync(attributeId, hard: false, CancellationToken.None)
        );

        Assert.Equal("Không tìm thấy thuộc tính để xoá.", exception.Message);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID04: DeleteAttributeAsync with deleted attribute (IsDeleted=TRUE) - Throw InvalidOperationException")]
    public async Task DeleteAttributeAsync_WithDeletedAttribute_ThrowsInvalidOperationException()
    {
        // Arrange
        int attributeId = 2;
        var attributeEntity = new AttributeEntity
        {
            AttributeId = 2,
            Name = "Size",
            TypeValue = "number",
            Unit = "kg",
            IsDeleted = true,
            CreatedAt = new DateTime(2024, 1, 1, 10, 0, 0),
            UpdatedAt = new DateTime(2024, 2, 1, 14, 30, 0)
        };

        _mockAttributeRepository
            .Setup(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributeEntity);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _attributeService.DeleteAttributeAsync(attributeId, hard: false, CancellationToken.None)
        );

        Assert.Equal("Thuộc tính đã ở trạng thái xoá mềm.", exception.Message);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockAttributeRepository.Verify(r => r.DeleteAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
