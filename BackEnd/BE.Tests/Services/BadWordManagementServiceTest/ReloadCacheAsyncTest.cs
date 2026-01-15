using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordManagementServiceTest;

/// <summary>
/// Unit Tests cho BadWordManagementService.ReloadCacheAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_RELOAD_CACHE.txt
/// </summary>
public class ReloadCacheAsyncTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly Mock<IBadWordService> _mockBadWordService;
    private readonly BadWordManagementService _service;

    public ReloadCacheAsyncTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _mockBadWordService = new Mock<IBadWordService>();
        _service = new BadWordManagementService(_mockBadWordRepository.Object, _mockBadWordService.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - _badWordService.ReloadCacheAsync: succeeds
    /// Expected: Completes successfully, ReloadCacheAsync called once
    /// </summary>
    [Fact]
    public async Task UTCID01_ReloadCacheAsync_ServiceSucceeds_CompletesSuccessfully()
    {
        // Arrange
        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.ReloadCacheAsync();

        // Assert
        _mockBadWordService.Verify(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Abnormal case - _badWordService.ReloadCacheAsync: throws InvalidOperationException
    /// Expected: Throws InvalidOperationException
    /// </summary>
    [Fact]
    public async Task UTCID02_ReloadCacheAsync_ServiceThrowsInvalidOperationException_ThrowsException()
    {
        // Arrange
        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Cache error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.ReloadCacheAsync());

        _mockBadWordService.Verify(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID03: Abnormal case - _badWordService.ReloadCacheAsync: throws OperationCanceledException
    /// Expected: Throws OperationCanceledException
    /// </summary>
    [Fact]
    public async Task UTCID03_ReloadCacheAsync_ServiceThrowsOperationCanceledException_ThrowsException()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        cts.Cancel();

        _mockBadWordService
            .Setup(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        // Act & Assert
        await Assert.ThrowsAsync<OperationCanceledException>(
            async () => await _service.ReloadCacheAsync(cts.Token));

        _mockBadWordService.Verify(s => s.ReloadCacheAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

