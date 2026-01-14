using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordServiceTest;

/// <summary>
/// Unit Tests cho BadWordService.CheckAndFilterMessageAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_CHECK_AND_FILTER_MESSAGE.txt
/// </summary>
public class CheckAndFilterMessageAsyncTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly IMemoryCache _cache;
    private readonly BadWordService _service;

    public CheckAndFilterMessageAsyncTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _service = new BadWordService(_mockBadWordRepository.Object, _cache);
    }

    /// <summary>
    /// UTCID01: Normal case - message: null
    /// Expected: Returns (isBlocked: false, filteredMessage: null, violationLevel: 0)
    /// </summary>
    [Fact]
    public async Task UTCID01_CheckAndFilterMessageAsync_NullMessage_ReturnsNotBlocked()
    {
        // Arrange
        string? message = null;

        // Act
        var result = await _service.CheckAndFilterMessageAsync(message!);

        // Assert
        Assert.False(result.isBlocked);
        Assert.Null(result.filteredMessage);
        Assert.Equal(0, result.violationLevel);
    }

    /// <summary>
    /// UTCID02: Normal case - message: "" (empty)
    /// Expected: Returns (isBlocked: false, filteredMessage: "", violationLevel: 0)
    /// </summary>
    [Fact]
    public async Task UTCID02_CheckAndFilterMessageAsync_EmptyMessage_ReturnsNotBlocked()
    {
        // Arrange
        string message = "";

        // Act
        var result = await _service.CheckAndFilterMessageAsync(message);

        // Assert
        Assert.False(result.isBlocked);
        Assert.Equal("", result.filteredMessage);
        Assert.Equal(0, result.violationLevel);
    }

    /// <summary>
    /// UTCID03: Normal case - message: "   " (whitespace)
    /// Expected: Returns (isBlocked: false, filteredMessage: "   ", violationLevel: 0)
    /// </summary>
    [Fact]
    public async Task UTCID03_CheckAndFilterMessageAsync_WhitespaceMessage_ReturnsNotBlocked()
    {
        // Arrange
        string message = "   ";

        // Act
        var result = await _service.CheckAndFilterMessageAsync(message);

        // Assert
        Assert.False(result.isBlocked);
        Assert.Equal("   ", result.filteredMessage);
        Assert.Equal(0, result.violationLevel);
    }

    /// <summary>
    /// UTCID04: Normal case - message: "Hello world" (no bad words)
    /// Expected: Returns (isBlocked: false, filteredMessage: unchanged, violationLevel: 0)
    /// </summary>
    [Fact]
    public async Task UTCID04_CheckAndFilterMessageAsync_NoBadWords_ReturnsNotBlocked()
    {
        // Arrange
        string message = "Hello world";
        var badWords = new List<BadWord>
        {
            new BadWord { BadWordId = 1, Word = "spam", Level = 1, IsActive = true, IsRegex = false },
            new BadWord { BadWordId = 2, Word = "badword", Level = 2, IsActive = true, IsRegex = false }
        };

        _mockBadWordRepository
            .Setup(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Act
        var result = await _service.CheckAndFilterMessageAsync(message);

        // Assert
        Assert.False(result.isBlocked);
        Assert.Equal("Hello world", result.filteredMessage);
        Assert.Equal(0, result.violationLevel);
    }

    /// <summary>
    /// UTCID05: Normal case - message contains Level 1 word
    /// Expected: Returns (isBlocked: false, filteredMessage: contains "***", violationLevel: 1)
    /// </summary>
    [Fact]
    public async Task UTCID05_CheckAndFilterMessageAsync_Level1Word_FiltersWord()
    {
        // Arrange
        string message = "This is spam message";
        var badWords = new List<BadWord>
        {
            new BadWord { BadWordId = 1, Word = "spam", Level = 1, IsActive = true, IsRegex = false }
        };

        _mockBadWordRepository
            .Setup(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Clear cache to ensure fresh load
        _cache.Remove("BadWords_Active");

        // Act
        var result = await _service.CheckAndFilterMessageAsync(message);

        // Assert
        Assert.False(result.isBlocked);
        Assert.Contains("***", result.filteredMessage);
        Assert.Equal(1, result.violationLevel);
    }

    /// <summary>
    /// UTCID06: Normal case - message contains Level 2 word
    /// Expected: Returns (isBlocked: true, filteredMessage: unchanged, violationLevel: 2)
    /// </summary>
    [Fact]
    public async Task UTCID06_CheckAndFilterMessageAsync_Level2Word_BlocksMessage()
    {
        // Arrange
        string message = "This is badword message";
        var badWords = new List<BadWord>
        {
            new BadWord { BadWordId = 1, Word = "badword", Level = 2, IsActive = true, IsRegex = false }
        };

        _mockBadWordRepository
            .Setup(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Clear cache
        _cache.Remove("BadWords_Active");

        // Act
        var result = await _service.CheckAndFilterMessageAsync(message);

        // Assert
        Assert.True(result.isBlocked);
        Assert.Equal(2, result.violationLevel);
    }

    /// <summary>
    /// UTCID07: Normal case - message contains Level 3 word
    /// Expected: Returns (isBlocked: true, filteredMessage: unchanged, violationLevel: 3)
    /// </summary>
    [Fact]
    public async Task UTCID07_CheckAndFilterMessageAsync_Level3Word_BlocksMessage()
    {
        // Arrange
        string message = "This is verybad message";
        var badWords = new List<BadWord>
        {
            new BadWord { BadWordId = 1, Word = "verybad", Level = 3, IsActive = true, IsRegex = false }
        };

        _mockBadWordRepository
            .Setup(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Clear cache
        _cache.Remove("BadWords_Active");

        // Act
        var result = await _service.CheckAndFilterMessageAsync(message);

        // Assert
        Assert.True(result.isBlocked);
        Assert.Equal(3, result.violationLevel);
    }

    /// <summary>
    /// UTCID08: Normal case - message contains Level 1 and Level 2 words
    /// Expected: Returns (isBlocked: true, violationLevel: 2 - highest level)
    /// </summary>
    [Fact]
    public async Task UTCID08_CheckAndFilterMessageAsync_MultipleWords_UsesHighestLevel()
    {
        // Arrange
        string message = "This is spam and badword message";
        var badWords = new List<BadWord>
        {
            new BadWord { BadWordId = 1, Word = "spam", Level = 1, IsActive = true, IsRegex = false },
            new BadWord { BadWordId = 2, Word = "badword", Level = 2, IsActive = true, IsRegex = false }
        };

        _mockBadWordRepository
            .Setup(r => r.GetActiveBadWordsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Clear cache
        _cache.Remove("BadWords_Active");

        // Act
        var result = await _service.CheckAndFilterMessageAsync(message);

        // Assert
        Assert.True(result.isBlocked);
        Assert.Equal(2, result.violationLevel); // Highest level
    }
}

