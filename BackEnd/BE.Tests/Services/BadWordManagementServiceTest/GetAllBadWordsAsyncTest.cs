using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordManagementServiceTest;

/// <summary>
/// Unit Tests cho BadWordManagementService.GetAllBadWordsAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_ALL_BAD_WORDS.txt
/// </summary>
public class GetAllBadWordsAsyncTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly Mock<IBadWordService> _mockBadWordService;
    private readonly BadWordManagementService _service;

    public GetAllBadWordsAsyncTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _mockBadWordService = new Mock<IBadWordService>();
        _service = new BadWordManagementService(_mockBadWordRepository.Object, _mockBadWordService.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - GetAllAsync returns list with multiple items (count > 1)
    /// Expected: Returns IEnumerable<BadWordDto>, Result.Count matches repository result count, greater than 1
    /// </summary>
    [Fact]
    public async Task UTCID01_GetAllBadWordsAsync_ReturnsMultipleItems_ReturnsListWithMultipleItems()
    {
        // Arrange
        var badWords = new List<BadWord>
        {
            new BadWord { BadWordId = 1, Word = "spam", IsRegex = false, Level = 1, Category = "spam", IsActive = true },
            new BadWord { BadWordId = 2, Word = "offensive", IsRegex = false, Level = 2, Category = "offensive", IsActive = true },
            new BadWord { BadWordId = 3, Word = "blocked", IsRegex = true, Level = 3, Category = "blocked", IsActive = true }
        };

        _mockBadWordRepository
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Act
        var result = await _service.GetAllBadWordsAsync();

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Equal(3, resultList.Count);
        Assert.True(resultList.Count > 1);
        Assert.All(resultList, item => Assert.IsType<BadWordDto>(item));
        
        // Verify properties mapped correctly
        Assert.Equal(1, resultList[0].BadWordId);
        Assert.Equal("spam", resultList[0].Word);
        Assert.Equal(1, resultList[0].Level);
        Assert.True(resultList[0].IsActive);

        _mockBadWordRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - GetAllAsync returns empty list
    /// Expected: Returns IEnumerable<BadWordDto>, Result.Count equals 0
    /// </summary>
    [Fact]
    public async Task UTCID02_GetAllBadWordsAsync_ReturnsEmptyList_ReturnsEmptyList()
    {
        // Arrange
        var badWords = new List<BadWord>();

        _mockBadWordRepository
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Act
        var result = await _service.GetAllBadWordsAsync();

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Empty(resultList);
        Assert.Equal(0, resultList.Count);

        _mockBadWordRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID03: Abnormal case - GetAllAsync throws InvalidOperationException
    /// Expected: Exception of Type: InvalidOperationException
    /// </summary>
    [Fact]
    public async Task UTCID03_GetAllBadWordsAsync_ThrowsInvalidOperationException_ThrowsException()
    {
        // Arrange
        _mockBadWordRepository
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Database error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.GetAllBadWordsAsync());

        _mockBadWordRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID04: Abnormal case - GetAllAsync throws OperationCanceledException
    /// Expected: Exception of Type: OperationCanceledException
    /// </summary>
    [Fact]
    public async Task UTCID04_GetAllBadWordsAsync_ThrowsOperationCanceledException_ThrowsException()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        cts.Cancel();

        _mockBadWordRepository
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        // Act & Assert
        await Assert.ThrowsAsync<OperationCanceledException>(
            async () => await _service.GetAllBadWordsAsync(cts.Token));

        _mockBadWordRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID05: Boundary case - GetAllAsync returns list with 1 item
    /// Expected: Returns IEnumerable<BadWordDto>, Result.Count equals 1
    /// </summary>
    [Fact]
    public async Task UTCID05_GetAllBadWordsAsync_ReturnsSingleItem_ReturnsListWithSingleItem()
    {
        // Arrange
        var badWords = new List<BadWord>
        {
            new BadWord { BadWordId = 1, Word = "test", IsRegex = false, Level = 2, Category = "test", IsActive = true }
        };

        _mockBadWordRepository
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(badWords);

        // Act
        var result = await _service.GetAllBadWordsAsync();

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Single(resultList);
        Assert.Equal(1, resultList.Count);
        Assert.IsType<BadWordDto>(resultList[0]);
        
        // Verify properties mapped correctly
        Assert.Equal(1, resultList[0].BadWordId);
        Assert.Equal("test", resultList[0].Word);
        Assert.Equal(2, resultList[0].Level);

        _mockBadWordRepository.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

