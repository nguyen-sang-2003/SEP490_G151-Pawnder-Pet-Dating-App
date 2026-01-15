using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordManagementServiceTest;

/// <summary>
/// Unit Tests cho BadWordManagementService.CreateBadWordAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_CREATE_BAD_WORD.txt
/// </summary>
public class CreateBadWordAsyncTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly Mock<IBadWordService> _mockBadWordService;
    private readonly BadWordManagementService _service;

    public CreateBadWordAsyncTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _mockBadWordService = new Mock<IBadWordService>();
        _service = new BadWordManagementService(_mockBadWordRepository.Object, _mockBadWordService.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - request.Word: "spam" (valid), request.Level: 2 (valid, 1-3)
    /// Expected: Returns BadWordDto, all properties mapped correctly
    /// </summary>
    [Fact]
    public async Task UTCID01_CreateBadWordAsync_ValidWordValidLevel_ReturnsBadWordDto()
    {
        // Arrange
        var request = new CreateBadWordRequest
        {
            Word = "spam",
            IsRegex = false,
            Level = 2,
            Category = "test"
        };

        _mockBadWordRepository
            .Setup(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord bw, CancellationToken ct) =>
            {
                bw.BadWordId = 1;
                return bw;
            });

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateBadWordAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<BadWordDto>(result);
        Assert.Equal(1, result.BadWordId);
        Assert.Equal("spam", result.Word);
        Assert.Equal(2, result.Level);
        Assert.True(result.IsActive);

        _mockBadWordRepository.Verify(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockBadWordService.Verify(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Abnormal case - request.Word: null
    /// Expected: Throws ArgumentException
    /// </summary>
    [Fact]
    public async Task UTCID02_CreateBadWordAsync_WordNull_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateBadWordRequest
        {
            Word = null!,
            Level = 2
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.CreateBadWordAsync(request));

        Assert.Contains("Từ cấm không được để trống", exception.Message);

        _mockBadWordRepository.Verify(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Abnormal case - request.Word: "" (empty)
    /// Expected: Throws ArgumentException with "Từ cấm không được để trống."
    /// </summary>
    [Fact]
    public async Task UTCID03_CreateBadWordAsync_WordEmpty_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateBadWordRequest
        {
            Word = "",
            Level = 2
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.CreateBadWordAsync(request));

        Assert.Equal("Từ cấm không được để trống.", exception.Message);

        _mockBadWordRepository.Verify(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID04: Abnormal case - request.Word: "   " (whitespace)
    /// Expected: Throws ArgumentException with "Từ cấm không được để trống."
    /// </summary>
    [Fact]
    public async Task UTCID04_CreateBadWordAsync_WordWhitespace_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateBadWordRequest
        {
            Word = "   ",
            Level = 2
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.CreateBadWordAsync(request));

        Assert.Equal("Từ cấm không được để trống.", exception.Message);

        _mockBadWordRepository.Verify(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID05: Boundary case - request.Level: 1 (valid, boundary minimum)
    /// Expected: Returns BadWordDto
    /// </summary>
    [Fact]
    public async Task UTCID05_CreateBadWordAsync_LevelBoundaryMin_ReturnsBadWordDto()
    {
        // Arrange
        var request = new CreateBadWordRequest
        {
            Word = "spam",
            Level = 1, // Boundary minimum
            Category = "test"
        };

        _mockBadWordRepository
            .Setup(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord bw, CancellationToken ct) =>
            {
                bw.BadWordId = 1;
                return bw;
            });

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateBadWordAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Level);

        _mockBadWordRepository.Verify(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID06: Boundary case - request.Level: 3 (valid, boundary maximum)
    /// Expected: Returns BadWordDto
    /// </summary>
    [Fact]
    public async Task UTCID06_CreateBadWordAsync_LevelBoundaryMax_ReturnsBadWordDto()
    {
        // Arrange
        var request = new CreateBadWordRequest
        {
            Word = "spam",
            Level = 3, // Boundary maximum
            Category = "test"
        };

        _mockBadWordRepository
            .Setup(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord bw, CancellationToken ct) =>
            {
                bw.BadWordId = 1;
                return bw;
            });

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateBadWordAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Level);

        _mockBadWordRepository.Verify(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID07: Abnormal case - request.Level: 0 (invalid, less than 1)
    /// Expected: Throws ArgumentException with "Level phải từ 1 đến 3."
    /// </summary>
    [Fact]
    public async Task UTCID07_CreateBadWordAsync_LevelZero_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateBadWordRequest
        {
            Word = "spam",
            Level = 0 // Invalid - less than 1
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.CreateBadWordAsync(request));

        Assert.Equal("Level phải từ 1 đến 3.", exception.Message);

        _mockBadWordRepository.Verify(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID08: Abnormal case - request.Level: 4 (invalid, greater than 3)
    /// Expected: Throws ArgumentException with "Level phải từ 1 đến 3."
    /// </summary>
    [Fact]
    public async Task UTCID08_CreateBadWordAsync_LevelFour_ThrowsArgumentException()
    {
        // Arrange
        var request = new CreateBadWordRequest
        {
            Word = "spam",
            Level = 4 // Invalid - greater than 3
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.CreateBadWordAsync(request));

        Assert.Equal("Level phải từ 1 đến 3.", exception.Message);

        _mockBadWordRepository.Verify(r => r.AddAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}

