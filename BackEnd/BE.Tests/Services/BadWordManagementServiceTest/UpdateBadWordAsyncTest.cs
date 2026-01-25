using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordManagementServiceTest;

/// <summary>
/// Unit Tests cho BadWordManagementService.UpdateBadWordAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_UPDATE_BAD_WORD.txt
/// </summary>
public class UpdateBadWordAsyncTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly Mock<IBadWordService> _mockBadWordService;
    private readonly BadWordManagementService _service;

    public UpdateBadWordAsyncTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _mockBadWordService = new Mock<IBadWordService>();
        _service = new BadWordManagementService(_mockBadWordRepository.Object, _mockBadWordService.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - badWordId: 1 (exists), request.Word: "updatedword", request.Level: 2
    /// Expected: Returns BadWordDto, all properties updated correctly
    /// </summary>
    [Fact]
    public async Task UTCID01_UpdateBadWordAsync_ValidIdValidData_ReturnsBadWordDto()
    {
        // Arrange
        int badWordId = 1;
        var existingBadWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "oldword",
            IsRegex = false,
            Level = 1,
            Category = "test",
            IsActive = true
        };

        var request = new UpdateBadWordRequest
        {
            Word = "updatedword",
            Level = 2,
            IsActive = true
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingBadWord);

        _mockBadWordRepository
            .Setup(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateBadWordAsync(badWordId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(badWordId, result.BadWordId);
        Assert.Equal("updatedword", result.Word);
        Assert.Equal(2, result.Level);

        _mockBadWordRepository.Verify(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()), Times.Once);
        _mockBadWordRepository.Verify(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockBadWordService.Verify(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Abnormal case - badWordId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException with "Không tìm thấy từ cấm."
    /// </summary>
    [Fact]
    public async Task UTCID02_UpdateBadWordAsync_NonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int badWordId = 999;
        var request = new UpdateBadWordRequest { Word = "test" };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdateBadWordAsync(badWordId, request));

        Assert.Equal("Không tìm thấy từ cấm.", exception.Message);

        _mockBadWordRepository.Verify(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Boundary case - badWordId: 1 (exists), request.Level: 1 (boundary minimum)
    /// Expected: Returns BadWordDto with Level = 1
    /// </summary>
    [Fact]
    public async Task UTCID03_UpdateBadWordAsync_LevelBoundaryMin_ReturnsBadWordDto()
    {
        // Arrange
        int badWordId = 1;
        var existingBadWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "word",
            Level = 2,
            IsActive = true
        };

        var request = new UpdateBadWordRequest
        {
            Word = "updatedword",
            Level = 1 // Boundary minimum
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingBadWord);

        _mockBadWordRepository
            .Setup(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateBadWordAsync(badWordId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Level);
    }

    /// <summary>
    /// UTCID04: Boundary case - badWordId: 1 (exists), request.Level: 3 (boundary maximum)
    /// Expected: Returns BadWordDto with Level = 3
    /// </summary>
    [Fact]
    public async Task UTCID04_UpdateBadWordAsync_LevelBoundaryMax_ReturnsBadWordDto()
    {
        // Arrange
        int badWordId = 1;
        var existingBadWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "word",
            Level = 1,
            IsActive = true
        };

        var request = new UpdateBadWordRequest
        {
            Word = "updatedword",
            Level = 3 // Boundary maximum
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingBadWord);

        _mockBadWordRepository
            .Setup(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateBadWordAsync(badWordId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Level);
    }

    /// <summary>
    /// UTCID05: Abnormal case - badWordId: 1 (exists), request.Level: 0 (invalid)
    /// Expected: Throws ArgumentException with "Level phải từ 1 đến 3."
    /// </summary>
    [Fact]
    public async Task UTCID05_UpdateBadWordAsync_LevelZero_ThrowsArgumentException()
    {
        // Arrange
        int badWordId = 1;
        var existingBadWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "word",
            Level = 2,
            IsActive = true
        };

        var request = new UpdateBadWordRequest
        {
            Word = "updatedword",
            Level = 0 // Invalid
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingBadWord);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.UpdateBadWordAsync(badWordId, request));

        Assert.Equal("Level phải từ 1 đến 3.", exception.Message);

        _mockBadWordRepository.Verify(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID06: Normal case - badWordId: 1 (exists), request.Word: null (not update), request.Level: null (not update)
    /// Expected: Returns BadWordDto, values not changed
    /// </summary>
    [Fact]
    public async Task UTCID06_UpdateBadWordAsync_NullFields_NoChanges()
    {
        // Arrange
        int badWordId = 1;
        var existingBadWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "originalword",
            Level = 2,
            IsActive = true
        };

        var request = new UpdateBadWordRequest
        {
            Word = null,
            Level = null,
            IsActive = true
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingBadWord);

        _mockBadWordRepository
            .Setup(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateBadWordAsync(badWordId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("originalword", result.Word); // Word should not change
        Assert.Equal(2, result.Level); // Level should not change
    }

    /// <summary>
    /// UTCID07: Normal case - badWordId: 1 (exists), only update Word
    /// Expected: Returns BadWordDto with updated Word
    /// </summary>
    [Fact]
    public async Task UTCID07_UpdateBadWordAsync_OnlyUpdateWord_ReturnsBadWordDto()
    {
        // Arrange
        int badWordId = 1;
        var existingBadWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "oldword",
            Level = 2,
            IsActive = true
        };

        var request = new UpdateBadWordRequest
        {
            Word = "updatedword",
            IsActive = true
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingBadWord);

        _mockBadWordRepository
            .Setup(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.UpdateBadWordAsync(badWordId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("updatedword", result.Word);
        Assert.Equal(2, result.Level); // Level unchanged
    }

    /// <summary>
    /// UTCID08: Abnormal case - badWordId: 1 (exists), request.Level: 4 (invalid)
    /// Expected: Throws ArgumentException with "Level phải từ 1 đến 3."
    /// </summary>
    [Fact]
    public async Task UTCID08_UpdateBadWordAsync_LevelFour_ThrowsArgumentException()
    {
        // Arrange
        int badWordId = 1;
        var existingBadWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "word",
            Level = 2,
            IsActive = true
        };

        var request = new UpdateBadWordRequest
        {
            Word = "updatedword",
            Level = 4 // Invalid
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingBadWord);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            async () => await _service.UpdateBadWordAsync(badWordId, request));

        Assert.Equal("Level phải từ 1 đến 3.", exception.Message);

        _mockBadWordRepository.Verify(r => r.UpdateAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}

