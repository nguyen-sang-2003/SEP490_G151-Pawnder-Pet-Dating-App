using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetVersionsByPolicyIdAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_VERSIONS_BY_POLICY_ID.txt
/// </summary>
public class GetVersionsByPolicyIdAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetVersionsByPolicyIdAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - policyId: 1 (exists), has multiple versions
    /// Expected: Returns List<PolicyVersionResponse> with multiple items
    /// </summary>
    [Fact]
    public async Task UTCID01_GetVersionsByPolicyIdAsync_MultipleVersions_ReturnsListWithMultipleItems()
    {
        // Arrange
        int policyId = 1;
        var policy = new Policy { PolicyId = policyId, PolicyCode = "TERMS", PolicyName = "Terms" };
        var versions = new List<PolicyVersion>
        {
            new PolicyVersion { PolicyVersionId = 1, PolicyId = policyId, VersionNumber = 1, Title = "v1", Content = "Content 1", Status = "INACTIVE", Policy = policy },
            new PolicyVersion { PolicyVersionId = 2, PolicyId = policyId, VersionNumber = 2, Title = "v2", Content = "Content 2", Status = "ACTIVE", Policy = policy }
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(policy);

        _mockPolicyRepository
            .Setup(r => r.GetVersionsByPolicyIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(versions);

        // Act
        var result = await _service.GetVersionsByPolicyIdAsync(policyId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.True(result.Count > 1);
    }

    /// <summary>
    /// UTCID02: Normal case - policyId: 1 (exists), has 1 version
    /// Expected: Returns List<PolicyVersionResponse> with 1 item
    /// </summary>
    [Fact]
    public async Task UTCID02_GetVersionsByPolicyIdAsync_SingleVersion_ReturnsListWithSingleItem()
    {
        // Arrange
        int policyId = 1;
        var policy = new Policy { PolicyId = policyId, PolicyCode = "TERMS", PolicyName = "Terms" };
        var versions = new List<PolicyVersion>
        {
            new PolicyVersion { PolicyVersionId = 1, PolicyId = policyId, VersionNumber = 1, Title = "v1", Content = "Content", Status = "ACTIVE", Policy = policy }
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(policy);

        _mockPolicyRepository
            .Setup(r => r.GetVersionsByPolicyIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(versions);

        // Act
        var result = await _service.GetVersionsByPolicyIdAsync(policyId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
    }

    /// <summary>
    /// UTCID03: Normal case - policyId: 1 (exists), has no versions
    /// Expected: Returns empty List<PolicyVersionResponse>
    /// </summary>
    [Fact]
    public async Task UTCID03_GetVersionsByPolicyIdAsync_NoVersions_ReturnsEmptyList()
    {
        // Arrange
        int policyId = 1;
        var policy = new Policy { PolicyId = policyId, PolicyCode = "TERMS", PolicyName = "Terms" };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(policy);

        _mockPolicyRepository
            .Setup(r => r.GetVersionsByPolicyIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        // Act
        var result = await _service.GetVersionsByPolicyIdAsync(policyId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    /// <summary>
    /// UTCID04: Normal case - policyId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_GetVersionsByPolicyIdAsync_NonExistentPolicy_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = 999;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionsByPolicyIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID05: Abnormal case - policyId: 0
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_GetVersionsByPolicyIdAsync_IdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = 0;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionsByPolicyIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID06: Abnormal case - policyId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_GetVersionsByPolicyIdAsync_NegativeId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = -1;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionsByPolicyIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID07: Boundary case - policyId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID07_GetVersionsByPolicyIdAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = int.MaxValue;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionsByPolicyIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID08: Boundary case - policyId: int.MinValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID08_GetVersionsByPolicyIdAsync_IntMinValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = int.MinValue;

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetVersionsByPolicyIdAsync(policyId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID09: Abnormal case - policyId: 1 (exists), GetVersionsByPolicyIdAsync throws InvalidOperationException
    /// Expected: Throws InvalidOperationException
    /// </summary>
    [Fact]
    public async Task UTCID09_GetVersionsByPolicyIdAsync_RepositoryThrowsException_ThrowsInvalidOperationException()
    {
        // Arrange
        int policyId = 1;
        var policy = new Policy { PolicyId = policyId, PolicyCode = "TERMS", PolicyName = "Terms" };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(policy);

        _mockPolicyRepository
            .Setup(r => r.GetVersionsByPolicyIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Database error"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.GetVersionsByPolicyIdAsync(policyId));
    }
}

