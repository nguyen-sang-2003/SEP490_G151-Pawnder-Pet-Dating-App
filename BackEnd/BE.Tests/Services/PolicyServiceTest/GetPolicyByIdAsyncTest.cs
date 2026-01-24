using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetPolicyByIdAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_POLICY_BY_ID.txt
/// </summary>
public class GetPolicyByIdAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetPolicyByIdAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - policyId: 1 (exists)
    /// Expected: Returns PolicyResponse, PolicyId matches input
    /// </summary>
    [Fact]
    public async Task UTCID01_GetPolicyByIdAsync_ValidIdExists_ReturnsPolicyResponse()
    {
        // Arrange
        int policyId = 1;
        var policy = new Policy
        {
            PolicyId = policyId,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            IsActive = true,
            IsDeleted = false
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(policy);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        _mockPolicyRepository
            .Setup(r => r.GetVersionsByPolicyIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        // Act
        var result = await _service.GetPolicyByIdAsync(policyId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyResponse>(result);
        Assert.Equal(policyId, result.PolicyId);
        Assert.Equal("TERMS", result.PolicyCode);

        _mockPolicyRepository.Verify(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - policyId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException with "Không tìm thấy Policy"
    /// </summary>
    [Fact]
    public async Task UTCID02_GetPolicyByIdAsync_NonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = 999;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetPolicyByIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID03: Abnormal case - policyId: 0
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID03_GetPolicyByIdAsync_IdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = 0;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetPolicyByIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID04: Abnormal case - policyId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_GetPolicyByIdAsync_NegativeId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = -1;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetPolicyByIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID05: Boundary case - policyId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_GetPolicyByIdAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = int.MaxValue;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetPolicyByIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID06: Boundary case - policyId: int.MinValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_GetPolicyByIdAsync_IntMinValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = int.MinValue;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetPolicyByIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }
}

