using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetAllPoliciesAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_ALL_POLICIES.txt
/// </summary>
public class GetAllPoliciesAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetAllPoliciesAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - GetAllPoliciesAsync returns list with multiple items
    /// Expected: Returns List<PolicyResponse>, Result.Count > 1
    /// </summary>
    [Fact]
    public async Task UTCID01_GetAllPoliciesAsync_ReturnsMultipleItems_ReturnsListWithMultipleItems()
    {
        // Arrange
        var policies = new List<Policy>
        {
            new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms of Service", IsActive = true, IsDeleted = false },
            new Policy { PolicyId = 2, PolicyCode = "PRIVACY", PolicyName = "Privacy Policy", IsActive = true, IsDeleted = false }
        };

        _mockPolicyRepository
            .Setup(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(policies);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        _mockPolicyRepository
            .Setup(r => r.GetVersionsByPolicyIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        // Act
        var result = await _service.GetAllPoliciesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.True(result.Count > 1);
        Assert.All(result, item => Assert.IsType<PolicyResponse>(item));

        _mockPolicyRepository.Verify(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - GetAllPoliciesAsync returns empty list
    /// Expected: Returns List<PolicyResponse>, Result.Count = 0
    /// </summary>
    [Fact]
    public async Task UTCID02_GetAllPoliciesAsync_ReturnsEmptyList_ReturnsEmptyList()
    {
        // Arrange
        var policies = new List<Policy>();

        _mockPolicyRepository
            .Setup(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(policies);

        // Act
        var result = await _service.GetAllPoliciesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        Assert.Equal(0, result.Count);

        _mockPolicyRepository.Verify(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID03: Abnormal case - GetAllPoliciesAsync throws InvalidOperationException
    /// Expected: Throws InvalidOperationException
    /// </summary>
    [Fact]
    public async Task UTCID03_GetAllPoliciesAsync_ThrowsInvalidOperationException_ThrowsException()
    {
        // Arrange
        _mockPolicyRepository
            .Setup(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Database error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.GetAllPoliciesAsync());

        _mockPolicyRepository.Verify(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID04: Abnormal case - GetAllPoliciesAsync throws OperationCanceledException
    /// Expected: Throws OperationCanceledException
    /// </summary>
    [Fact]
    public async Task UTCID04_GetAllPoliciesAsync_ThrowsOperationCanceledException_ThrowsException()
    {
        // Arrange
        var cts = new CancellationTokenSource();
        cts.Cancel();

        _mockPolicyRepository
            .Setup(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        // Act & Assert
        await Assert.ThrowsAsync<OperationCanceledException>(
            async () => await _service.GetAllPoliciesAsync(cts.Token));

        _mockPolicyRepository.Verify(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID05: Boundary case - GetAllPoliciesAsync returns list with 1 item
    /// Expected: Returns List<PolicyResponse>, Result.Count = 1
    /// </summary>
    [Fact]
    public async Task UTCID05_GetAllPoliciesAsync_ReturnsSingleItem_ReturnsListWithSingleItem()
    {
        // Arrange
        var policies = new List<Policy>
        {
            new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms of Service", IsActive = true, IsDeleted = false }
        };

        _mockPolicyRepository
            .Setup(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(policies);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        _mockPolicyRepository
            .Setup(r => r.GetVersionsByPolicyIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        // Act
        var result = await _service.GetAllPoliciesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal(1, result.Count);
        Assert.IsType<PolicyResponse>(result[0]);

        _mockPolicyRepository.Verify(r => r.GetAllPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

