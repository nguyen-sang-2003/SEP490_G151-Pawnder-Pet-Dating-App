using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordManagementServiceTest;

/// <summary>
/// Unit Tests cho BadWordManagementService.GetBadWordByIdAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_BAD_WORD_BY_ID.txt
/// </summary>
public class GetBadWordByIdAsyncTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly Mock<IBadWordService> _mockBadWordService;
    private readonly BadWordManagementService _service;

    public GetBadWordByIdAsyncTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _mockBadWordService = new Mock<IBadWordService>();
        _service = new BadWordManagementService(_mockBadWordRepository.Object, _mockBadWordService.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - badWordId: 1 (exists)
    /// Expected: Returns BadWordDto, BadWordDto.BadWordId matches input
    /// </summary>
    [Fact]
    public async Task UTCID01_GetBadWordByIdAsync_ValidIdExists_ReturnsBadWordDto()
    {
        // Arrange
        int badWordId = 1;
        var badWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "spam",
            IsRegex = false,
            Level = 2,
            Category = "test",
            IsActive = true
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWord);

        // Act
        var result = await _service.GetBadWordByIdAsync(badWordId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<BadWordDto>(result);
        Assert.Equal(badWordId, result.BadWordId);
        Assert.Equal("spam", result.Word);
        Assert.Equal(2, result.Level);
        Assert.True(result.IsActive);

        _mockBadWordRepository.Verify(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - badWordId: 999 (not exists)
    /// Expected: Returns null
    /// </summary>
    [Fact]
    public async Task UTCID02_GetBadWordByIdAsync_NonExistentId_ReturnsNull()
    {
        // Arrange
        int badWordId = 999;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act
        var result = await _service.GetBadWordByIdAsync(badWordId);

        // Assert
        Assert.Null(result);

        _mockBadWordRepository.Verify(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID03: Abnormal case - badWordId: 0
    /// Expected: Returns null (ID 0 không tồn tại)
    /// </summary>
    [Fact]
    public async Task UTCID03_GetBadWordByIdAsync_IdZero_ReturnsNull()
    {
        // Arrange
        int badWordId = 0;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act
        var result = await _service.GetBadWordByIdAsync(badWordId);

        // Assert
        Assert.Null(result);

        _mockBadWordRepository.Verify(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID04: Abnormal case - badWordId: -1 (negative)
    /// Expected: Returns null (ID âm không tồn tại)
    /// </summary>
    [Fact]
    public async Task UTCID04_GetBadWordByIdAsync_NegativeId_ReturnsNull()
    {
        // Arrange
        int badWordId = -1;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act
        var result = await _service.GetBadWordByIdAsync(badWordId);

        // Assert
        Assert.Null(result);

        _mockBadWordRepository.Verify(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID05: Boundary case - badWordId: int.MaxValue
    /// Expected: Returns null (ID quá lớn không tồn tại)
    /// </summary>
    [Fact]
    public async Task UTCID05_GetBadWordByIdAsync_IntMaxValue_ReturnsNull()
    {
        // Arrange
        int badWordId = int.MaxValue;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act
        var result = await _service.GetBadWordByIdAsync(badWordId);

        // Assert
        Assert.Null(result);

        _mockBadWordRepository.Verify(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID06: Boundary case - badWordId: int.MinValue
    /// Expected: Returns null (ID quá nhỏ không tồn tại)
    /// </summary>
    [Fact]
    public async Task UTCID06_GetBadWordByIdAsync_IntMinValue_ReturnsNull()
    {
        // Arrange
        int badWordId = int.MinValue;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act
        var result = await _service.GetBadWordByIdAsync(badWordId);

        // Assert
        Assert.Null(result);

        _mockBadWordRepository.Verify(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()), Times.Once);
    }
}

