using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Tests.Services.AttributeServiceTest;

public class UpdateAttributeAsyncTest
{
    private readonly Mock<IAttributeRepository> _mockAttributeRepository;
    private readonly AttributeService _attributeService;

    public UpdateAttributeAsyncTest()
    {
        _mockAttributeRepository = new Mock<IAttributeRepository>();
        _attributeService = new AttributeService(_mockAttributeRepository.Object);
    }

    [Fact(DisplayName = "UTCID01: UpdateAttributeAsync with valid id, new name (not exists), TypeValue, Unit - Return true and update entity")]
    public async Task UpdateAttributeAsync_WithValidIdAndNewName_ReturnsTrue()
    {
        // Arrange
        int attributeId = 1;
        var updateDto = new AttributeUpdateRequest
        {
            Name = "Cân nặng",
            TypeValue = "number",
            Unit = "kg"
        };

        var existingAttribute = new AttributeEntity
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
            .ReturnsAsync(existingAttribute);

        _mockAttributeRepository
            .Setup(r => r.NameExistsAsync(updateDto.Name, attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockAttributeRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _attributeService.UpdateAttributeAsync(attributeId, updateDto, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.NameExistsAsync(updateDto.Name, attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID02: UpdateAttributeAsync with non-existent id (999) - Throw KeyNotFoundException")]
    public async Task UpdateAttributeAsync_WithNonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int attributeId = 999;
        var updateDto = new AttributeUpdateRequest
        {
            Name = "Cân nặng",
            TypeValue = "number",
            Unit = "kg"
        };

        _mockAttributeRepository
            .Setup(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AttributeEntity)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _attributeService.UpdateAttributeAsync(attributeId, updateDto, CancellationToken.None)
        );

        Assert.Equal("Không tìm thấy thuộc tính để cập nhật.", exception.Message);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact(DisplayName = "UTCID03: UpdateAttributeAsync with invalid id (0) - Throw KeyNotFoundException")]
    public async Task UpdateAttributeAsync_WithInvalidId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int attributeId = 0;
        var updateDto = new AttributeUpdateRequest
        {
            Name = "Cân nặng",
            TypeValue = "number",
            Unit = "kg"
        };

        _mockAttributeRepository
            .Setup(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AttributeEntity)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _attributeService.UpdateAttributeAsync(attributeId, updateDto, CancellationToken.None)
        );

        Assert.Equal("Không tìm thấy thuộc tính để cập nhật.", exception.Message);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID04: UpdateAttributeAsync with duplicate name (exists, other attribute) - Throw InvalidOperationException")]
    public async Task UpdateAttributeAsync_WithDuplicateName_ThrowsInvalidOperationException()
    {
        // Arrange
        int attributeId = 1;
        var updateDto = new AttributeUpdateRequest
        {
            Name = "Kích thước",
            TypeValue = "number",
            Unit = "cm"
        };

        var existingAttribute = new AttributeEntity
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
            .ReturnsAsync(existingAttribute);

        _mockAttributeRepository
            .Setup(r => r.NameExistsAsync(updateDto.Name, attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _attributeService.UpdateAttributeAsync(attributeId, updateDto, CancellationToken.None)
        );

        Assert.Equal("Tên thuộc tính đã tồn tại.", exception.Message);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.NameExistsAsync(updateDto.Name, attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact(DisplayName = "UTCID05: UpdateAttributeAsync with empty/whitespace name - Returns true")]
    public async Task UpdateAttributeAsync_WithEmptyOrWhitespaceName_ReturnsTrue()
    {
        // Arrange
        int attributeId = 1;
        var updateDto = new AttributeUpdateRequest
        {
            Name = "",
            TypeValue = "number",
            Unit = "kg"
        };

        var existingAttribute = new AttributeEntity
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
            .ReturnsAsync(existingAttribute);

        _mockAttributeRepository
            .Setup(r => r.NameExistsAsync(It.IsAny<string>(), attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockAttributeRepository
            .Setup(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _attributeService.UpdateAttributeAsync(attributeId, updateDto, CancellationToken.None);

        // Assert
        Assert.True(result);
        _mockAttributeRepository.Verify(r => r.GetByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
        _mockAttributeRepository.Verify(r => r.UpdateAsync(It.IsAny<AttributeEntity>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
