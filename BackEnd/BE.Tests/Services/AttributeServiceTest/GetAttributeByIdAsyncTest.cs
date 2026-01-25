using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Tests.Services.AttributeServiceTest;

public class GetAttributeByIdAsyncTest
{
    private readonly Mock<IAttributeRepository> _mockAttributeRepository;
    private readonly AttributeService _attributeService;

    public GetAttributeByIdAsyncTest()
    {
        _mockAttributeRepository = new Mock<IAttributeRepository>();
        _attributeService = new AttributeService(_mockAttributeRepository.Object);
    }

    [Fact(DisplayName = "UTCID01: GetAttributeByIdAsync with valid id (exists) - Return AttributeResponse")]
    public async Task GetAttributeByIdAsync_WithValidId_ReturnsAttributeResponse()
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
            UpdatedAt = new DateTime(2024, 1, 15, 14, 30, 0)
        };

        _mockAttributeRepository
            .Setup(r => r.GetAttributeByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributeEntity);

        // Act
        var result = await _attributeService.GetAttributeByIdAsync(attributeId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<AttributeResponse>(result);
        Assert.Equal(1, result.AttributeId);
        Assert.Equal("Color", result.Name);
        Assert.Equal("string", result.TypeValue);
        Assert.Equal("N/A", result.Unit);
        Assert.False(result.IsDeleted);
        Assert.Equal(new DateTime(2024, 1, 1, 10, 0, 0), result.CreatedAt);
        Assert.Equal(new DateTime(2024, 1, 15, 14, 30, 0), result.UpdatedAt);
        _mockAttributeRepository.Verify(r => r.GetAttributeByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID02: GetAttributeByIdAsync with non-existent id (999) - Return null")]
    public async Task GetAttributeByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        int attributeId = 999;
        _mockAttributeRepository
            .Setup(r => r.GetAttributeByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AttributeEntity)null);

        // Act
        var result = await _attributeService.GetAttributeByIdAsync(attributeId, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockAttributeRepository.Verify(r => r.GetAttributeByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID03: GetAttributeByIdAsync with invalid id (0) - Return null")]
    public async Task GetAttributeByIdAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        int attributeId = 0;
        _mockAttributeRepository
            .Setup(r => r.GetAttributeByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AttributeEntity)null);

        // Act
        var result = await _attributeService.GetAttributeByIdAsync(attributeId, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockAttributeRepository.Verify(r => r.GetAttributeByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID04: GetAttributeByIdAsync with deleted attribute (isDeleted=TRUE) - Return null")]
    public async Task GetAttributeByIdAsync_WithDeletedAttribute_ReturnsNull()
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
            .Setup(r => r.GetAttributeByIdAsync(attributeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AttributeEntity)null);

        // Act
        var result = await _attributeService.GetAttributeByIdAsync(attributeId, CancellationToken.None);

        // Assert
        Assert.Null(result);
        _mockAttributeRepository.Verify(r => r.GetAttributeByIdAsync(attributeId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
