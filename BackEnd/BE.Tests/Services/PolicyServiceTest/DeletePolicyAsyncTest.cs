using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.DeletePolicyAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_DELETE_POLICY.txt
/// </summary>
public class DeletePolicyAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public DeletePolicyAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - policyId: 1 (exists)
    /// Expected: Returns true, DeletePolicyAsync called
    /// </summary>
    [Fact]
    public async Task UTCID01_DeletePolicyAsync_ValidIdExists_ReturnsTrue()
    {
        // Arrange
        int policyId = 1;

        _mockPolicyRepository
            .Setup(r => r.DeletePolicyAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.DeletePolicyAsync(policyId);

        // Assert
        Assert.True(result);

        _mockPolicyRepository.Verify(r => r.DeletePolicyAsync(policyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - policyId: 999 (not exists)
    /// Expected: Returns false
    /// </summary>
    [Fact]
    public async Task UTCID02_DeletePolicyAsync_NonExistentId_ReturnsFalse()
    {
        // Arrange
        int policyId = 999;

        _mockPolicyRepository
            .Setup(r => r.DeletePolicyAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.DeletePolicyAsync(policyId);

        // Assert
        Assert.False(result);

        _mockPolicyRepository.Verify(r => r.DeletePolicyAsync(policyId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID03: Abnormal case - policyId: 0
    /// Expected: Returns false
    /// </summary>
    [Fact]
    public async Task UTCID03_DeletePolicyAsync_IdZero_ReturnsFalse()
    {
        // Arrange
        int policyId = 0;

        _mockPolicyRepository
            .Setup(r => r.DeletePolicyAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.DeletePolicyAsync(policyId);

        // Assert
        Assert.False(result);
    }

    /// <summary>
    /// UTCID04: Abnormal case - policyId: -1 (negative)
    /// Expected: Returns false
    /// </summary>
    [Fact]
    public async Task UTCID04_DeletePolicyAsync_NegativeId_ReturnsFalse()
    {
        // Arrange
        int policyId = -1;

        _mockPolicyRepository
            .Setup(r => r.DeletePolicyAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.DeletePolicyAsync(policyId);

        // Assert
        Assert.False(result);
    }

    /// <summary>
    /// UTCID05: Boundary case - policyId: int.MaxValue
    /// Expected: Returns false
    /// </summary>
    [Fact]
    public async Task UTCID05_DeletePolicyAsync_IntMaxValue_ReturnsFalse()
    {
        // Arrange
        int policyId = int.MaxValue;

        _mockPolicyRepository
            .Setup(r => r.DeletePolicyAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.DeletePolicyAsync(policyId);

        // Assert
        Assert.False(result);
    }

    /// <summary>
    /// UTCID06: Boundary case - policyId: int.MinValue
    /// Expected: Returns false
    /// </summary>
    [Fact]
    public async Task UTCID06_DeletePolicyAsync_IntMinValue_ReturnsFalse()
    {
        // Arrange
        int policyId = int.MinValue;

        _mockPolicyRepository
            .Setup(r => r.DeletePolicyAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _service.DeletePolicyAsync(policyId);

        // Assert
        Assert.False(result);
    }
}

