using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordServiceTest;

/// <summary>
/// Unit Tests cho BadWordService.ReloadCacheAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_RELOAD_CACHE_BAD_WORD_SERVICE.txt
/// </summary>
public class ReloadCacheAsyncTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly IMemoryCache _cache;
    private readonly BadWordService _service;

    public ReloadCacheAsyncTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _service = new BadWordService(_mockBadWordRepository.Object, _cache);
    }

    /// <summary>
    /// UTCID01: Normal case - GetActiveBadWordsAsync returns list with bad words
    /// Expected: Task completed (no exception), Cache key removed, Cache populated with bad words
    /// </summary>
    [Fact]
    public async Task UTCID01_ReloadCacheAsync_RepositoryReturnsData_CacheReloaded()
    {
        // Arrange
        var badWords = new List<BadWord>
        {
            new BadWord { BadWordId = 1, Word = "spam", Level = 1, IsActive = true },
            new BadWord { BadWordId = 2, Word = "bad", Level = 2, IsActive = true }
        };

        _mockBadWordRepository
            .Setup(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Act
        await _service.ReloadCacheAsync();

        // Assert
        _mockBadWordRepository.Verify(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Abnormal case - GetActiveBadWordsAsync throws InvalidOperationException
    /// Expected: Throws InvalidOperationException
    /// </summary>
    [Fact]
    public async Task UTCID02_ReloadCacheAsync_RepositoryThrowsInvalidOperationException_ThrowsException()
    {
        // Arrange
        _mockBadWordRepository
            .Setup(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Database error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.ReloadCacheAsync());
    }

    /// <summary>
    /// UTCID03: Abnormal case - GetActiveBadWordsAsync throws OperationCanceledException
    /// Expected: Throws OperationCanceledException
    /// </summary>
    [Fact]
    public async Task UTCID03_ReloadCacheAsync_OperationCancelled_ThrowsException()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        cts.Cancel();

        _mockBadWordRepository
            .Setup(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        // Act & Assert
        await Assert.ThrowsAsync<OperationCanceledException>(
            async () => await _service.ReloadCacheAsync(cts.Token));
    }
}
