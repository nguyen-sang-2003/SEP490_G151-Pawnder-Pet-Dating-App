using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetVersionByIdAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_VERSION_BY_ID.txt
/// </summary>
public class GetVersionByIdAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetVersionByIdAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - policyVersionId: 1 (exists)
    /// Expected: Returns PolicyVersionResponse
    /// </summary>
    [Fact]
    public async Task UTCID01_GetVersionByIdAsync_ValidIdExists_ReturnsPolicyVersionResponse()
    {
        // Arrange
        int policyVersionId = 1;
        var policy = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var version = new PolicyVersion
        {
            PolicyVersionId = policyVersionId,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Version 1",
            Content = "Content",
            Status = "ACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        // Act
        var result = await _service.GetVersionByIdAsync(policyVersionId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyVersionResponse>(result);
        Assert.Equal(policyVersionId, result.PolicyVersionId);

        _mockPolicyRepository.Verify(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - policyVersionId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID02_GetVersionByIdAsync_NonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = 999;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionByIdAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID03: Abnormal case - policyVersionId: 0
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID03_GetVersionByIdAsync_IdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = 0;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionByIdAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID04: Abnormal case - policyVersionId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_GetVersionByIdAsync_NegativeId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = -1;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionByIdAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID05: Boundary case - policyVersionId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_GetVersionByIdAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = int.MaxValue;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionByIdAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID06: Boundary case - policyVersionId: int.MinValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_GetVersionByIdAsync_IntMinValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = int.MinValue;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionByIdAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }
}

