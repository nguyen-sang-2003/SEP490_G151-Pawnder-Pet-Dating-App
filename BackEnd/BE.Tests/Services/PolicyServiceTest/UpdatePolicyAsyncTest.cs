using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.UpdatePolicyAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_UPDATE_POLICY.txt
/// </summary>
public class UpdatePolicyAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public UpdatePolicyAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - policyId: 1 (exists), valid request
    /// Expected: Returns PolicyResponse with updated values
    /// </summary>
    [Fact]
    public async Task UTCID01_UpdatePolicyAsync_ValidIdValidData_ReturnsPolicyResponse()
    {
        // Arrange
        int policyId = 1;
        var existingPolicy = new Policy
        {
            PolicyId = policyId,
            PolicyCode = "TERMS",
            PolicyName = "Old Name",
            IsActive = false,
            IsDeleted = false
        };

        var request = new UpdatePolicyRequest
        {
            PolicyName = "Updated Name",
            IsActive = true
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingPolicy);

        _mockPolicyRepository
            .Setup(r => r.UpdatePolicyAsync(It.IsAny<Policy>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy p, CancellationToken ct) => p);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        _mockPolicyRepository
            .Setup(r => r.GetVersionsByPolicyIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        // Act
        var result = await _service.UpdatePolicyAsync(policyId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(policyId, result.PolicyId);
        Assert.Equal("Updated Name", result.PolicyName);
        Assert.True(result.IsActive);

        _mockPolicyRepository.Verify(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.UpdatePolicyAsync(It.IsAny<Policy>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - policyId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID02_UpdatePolicyAsync_NonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = 999;
        var request = new UpdatePolicyRequest { PolicyName = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdatePolicyAsync(policyId, request));

        Assert.Contains("Không tìm thấy Policy", exception.Message);

        _mockPolicyRepository.Verify(r => r.UpdatePolicyAsync(It.IsAny<Policy>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Abnormal case - policyId: 0
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID03_UpdatePolicyAsync_IdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = 0;
        var request = new UpdatePolicyRequest { PolicyName = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdatePolicyAsync(policyId, request));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID04: Abnormal case - policyId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_UpdatePolicyAsync_NegativeId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = -1;
        var request = new UpdatePolicyRequest { PolicyName = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdatePolicyAsync(policyId, request));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID05: Boundary case - policyId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_UpdatePolicyAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = int.MaxValue;
        var request = new UpdatePolicyRequest { PolicyName = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdatePolicyAsync(policyId, request));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID06: Boundary case - policyId: int.MinValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_UpdatePolicyAsync_IntMinValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = int.MinValue;
        var request = new UpdatePolicyRequest { PolicyName = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdatePolicyAsync(policyId, request));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }
}

