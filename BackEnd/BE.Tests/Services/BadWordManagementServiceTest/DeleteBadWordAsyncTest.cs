using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordManagementServiceTest;

/// <summary>
/// Unit Tests cho BadWordManagementService.DeleteBadWordAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_DELETE_BAD_WORD.txt
/// </summary>
public class DeleteBadWordAsyncTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly Mock<IBadWordService> _mockBadWordService;
    private readonly BadWordManagementService _service;

    public DeleteBadWordAsyncTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _mockBadWordService = new Mock<IBadWordService>();
        _service = new BadWordManagementService(_mockBadWordRepository.Object, _mockBadWordService.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - badWordId: 1 (exists)
    /// Expected: Returns true, DeleteAsync called, ReloadCacheAsync called
    /// </summary>
    [Fact]
    public async Task UTCID01_DeleteBadWordAsync_ValidIdExists_ReturnsTrue()
    {
        // Arrange
        int badWordId = 1;
        var existingBadWord = new BadWord
        {
            BadWordId = badWordId,
            Word = "spam",
            Level = 2,
            IsActive = true
        };

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingBadWord);

        _mockBadWordRepository
            .Setup(r => r.DeleteAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.DeleteBadWordAsync(badWordId);

        // Assert
        Assert.True(result);

        _mockBadWordRepository.Verify(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()), Times.Once);
        _mockBadWordRepository.Verify(r => r.DeleteAsync(existingBadWord, It.IsAny<CancellationToken>()), Times.Once);
        _mockBadWordService.Verify(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - badWordId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException with "Không tìm thấy từ cấm."
    /// </summary>
    [Fact]
    public async Task UTCID02_DeleteBadWordAsync_NonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int badWordId = 999;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteBadWordAsync(badWordId));

        Assert.Equal("Không tìm thấy từ cấm.", exception.Message);

        _mockBadWordRepository.Verify(r => r.DeleteAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockBadWordService.Verify(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Abnormal case - badWordId: 0
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID03_DeleteBadWordAsync_IdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        int badWordId = 0;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteBadWordAsync(badWordId));

        Assert.Equal("Không tìm thấy từ cấm.", exception.Message);

        _mockBadWordRepository.Verify(r => r.DeleteAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID04: Abnormal case - badWordId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_DeleteBadWordAsync_NegativeId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int badWordId = -1;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteBadWordAsync(badWordId));

        Assert.Equal("Không tìm thấy từ cấm.", exception.Message);

        _mockBadWordRepository.Verify(r => r.DeleteAsync(It.IsAny<BadWord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID05: Boundary case - badWordId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_DeleteBadWordAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int badWordId = int.MaxValue;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteBadWordAsync(badWordId));

        Assert.Equal("Không tìm thấy từ cấm.", exception.Message);
    }

    /// <summary>
    /// UTCID06: Boundary case - badWordId: int.MinValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_DeleteBadWordAsync_IntMinValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int badWordId = int.MinValue;

        _mockBadWordRepository
            .Setup(r => r.GetByIdAsync(badWordId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BadWord?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteBadWordAsync(badWordId));

        Assert.Equal("Không tìm thấy từ cấm.", exception.Message);
    }
}

