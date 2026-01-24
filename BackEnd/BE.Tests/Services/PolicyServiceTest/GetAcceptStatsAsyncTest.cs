using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetAcceptStatsAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_ACCEPT_STATS.txt
/// </summary>
public class GetAcceptStatsAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetAcceptStatsAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - 1 required policy with active version, 50/100 users accepted (50%)
    /// Expected: Returns list with 1 PolicyAcceptStatsResponse with correct calculations
    /// </summary>
    [Fact]
    public async Task UTCID01_GetAcceptStatsAsync_SinglePolicyWithActiveVersion_ReturnsCorrectStats()
    {
        // Arrange
        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            RequireConsent = true
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 2,
            Status = "ACTIVE",
            Policy = policy
        };

        int totalActiveUsers = 100;
        int acceptedUsers = 50;

        _mockPolicyRepository
            .Setup(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Policy> { policy });

        _mockPolicyRepository
            .Setup(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(totalActiveUsers);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        _mockPolicyRepository
            .Setup(r => r.CountAcceptedUsersAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(acceptedUsers);

        // Act
        var result = await _service.GetAcceptStatsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var stats = result[0];
        Assert.Equal(1, stats.PolicyId);
        Assert.Equal("TERMS", stats.PolicyCode);
        Assert.Equal("Terms of Service", stats.PolicyName);
        Assert.Equal(2, stats.ActiveVersionNumber);
        Assert.Equal(100, stats.TotalActiveUsers);
        Assert.Equal(50, stats.AcceptedUsers);
        Assert.Equal(50, stats.PendingUsers);
        Assert.Equal(50.00, stats.AcceptRate);

        // Verify method calls
        _mockPolicyRepository.Verify(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CountAcceptedUsersAsync(1, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - 1 required policy WITHOUT active version
    /// Expected: Returns empty list (policy skipped)
    /// </summary>
    [Fact]
    public async Task UTCID02_GetAcceptStatsAsync_PolicyWithoutActiveVersion_ReturnsEmptyList()
    {
        // Arrange
        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            RequireConsent = true
        };

        int totalActiveUsers = 100;

        _mockPolicyRepository
            .Setup(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Policy> { policy });

        _mockPolicyRepository
            .Setup(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(totalActiveUsers);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act
        var result = await _service.GetAcceptStatsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);

        // Verify method calls
        _mockPolicyRepository.Verify(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CountAcceptedUsersAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Normal case - Multiple required policies with active versions
    /// Expected: Returns list with multiple PolicyAcceptStatsResponse with correct calculations
    /// </summary>
    [Fact]
    public async Task UTCID03_GetAcceptStatsAsync_MultiplePoliciesWithActiveVersions_ReturnsMultipleStats()
    {
        // Arrange
        var policy1 = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            RequireConsent = true
        };

        var policy2 = new Policy
        {
            PolicyId = 2,
            PolicyCode = "PRIVACY",
            PolicyName = "Privacy Policy",
            RequireConsent = true
        };

        var activeVersion1 = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "ACTIVE",
            Policy = policy1
        };

        var activeVersion2 = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 2,
            VersionNumber = 3,
            Status = "ACTIVE",
            Policy = policy2
        };

        int totalActiveUsers = 100;

        _mockPolicyRepository
            .Setup(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Policy> { policy1, policy2 });

        _mockPolicyRepository
            .Setup(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(totalActiveUsers);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion1);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion2);

        _mockPolicyRepository
            .Setup(r => r.CountAcceptedUsersAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(75);

        _mockPolicyRepository
            .Setup(r => r.CountAcceptedUsersAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(60);

        // Act
        var result = await _service.GetAcceptStatsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        // Verify first policy stats
        var stats1 = result[0];
        Assert.Equal(1, stats1.PolicyId);
        Assert.Equal("TERMS", stats1.PolicyCode);
        Assert.Equal("Terms of Service", stats1.PolicyName);
        Assert.Equal(1, stats1.ActiveVersionNumber);
        Assert.Equal(100, stats1.TotalActiveUsers);
        Assert.Equal(75, stats1.AcceptedUsers);
        Assert.Equal(25, stats1.PendingUsers);
        Assert.Equal(75.00, stats1.AcceptRate);

        // Verify second policy stats
        var stats2 = result[1];
        Assert.Equal(2, stats2.PolicyId);
        Assert.Equal("PRIVACY", stats2.PolicyCode);
        Assert.Equal("Privacy Policy", stats2.PolicyName);
        Assert.Equal(3, stats2.ActiveVersionNumber);
        Assert.Equal(100, stats2.TotalActiveUsers);
        Assert.Equal(60, stats2.AcceptedUsers);
        Assert.Equal(40, stats2.PendingUsers);
        Assert.Equal(60.00, stats2.AcceptRate);

        // Verify method calls
        _mockPolicyRepository.Verify(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _mockPolicyRepository.Verify(r => r.CountAcceptedUsersAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    /// <summary>
    /// UTCID04: Boundary case - 1 policy, 0% accepted (0/100)
    /// Expected: Returns stats with 0% acceptance rate
    /// </summary>
    [Fact]
    public async Task UTCID04_GetAcceptStatsAsync_ZeroPercentAcceptance_ReturnsZeroAcceptRate()
    {
        // Arrange
        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            RequireConsent = true
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "ACTIVE",
            Policy = policy
        };

        int totalActiveUsers = 100;
        int acceptedUsers = 0;

        _mockPolicyRepository
            .Setup(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Policy> { policy });

        _mockPolicyRepository
            .Setup(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(totalActiveUsers);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        _mockPolicyRepository
            .Setup(r => r.CountAcceptedUsersAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(acceptedUsers);

        // Act
        var result = await _service.GetAcceptStatsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var stats = result[0];
        Assert.Equal(100, stats.TotalActiveUsers);
        Assert.Equal(0, stats.AcceptedUsers);
        Assert.Equal(100, stats.PendingUsers);
        Assert.Equal(0.00, stats.AcceptRate);
    }

    /// <summary>
    /// UTCID05: Boundary case - 1 policy, 100% accepted (100/100)
    /// Expected: Returns stats with 100% acceptance rate
    /// </summary>
    [Fact]
    public async Task UTCID05_GetAcceptStatsAsync_HundredPercentAcceptance_ReturnsHundredAcceptRate()
    {
        // Arrange
        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            RequireConsent = true
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "ACTIVE",
            Policy = policy
        };

        int totalActiveUsers = 100;
        int acceptedUsers = 100;

        _mockPolicyRepository
            .Setup(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Policy> { policy });

        _mockPolicyRepository
            .Setup(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(totalActiveUsers);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        _mockPolicyRepository
            .Setup(r => r.CountAcceptedUsersAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(acceptedUsers);

        // Act
        var result = await _service.GetAcceptStatsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var stats = result[0];
        Assert.Equal(100, stats.TotalActiveUsers);
        Assert.Equal(100, stats.AcceptedUsers);
        Assert.Equal(0, stats.PendingUsers);
        Assert.Equal(100.00, stats.AcceptRate);
    }

    /// <summary>
    /// UTCID06: Boundary case - Empty required policies list
    /// Expected: Returns empty list, handles gracefully without errors
    /// </summary>
    [Fact]
    public async Task UTCID06_GetAcceptStatsAsync_EmptyPoliciesList_ReturnsEmptyList()
    {
        // Arrange
        int totalActiveUsers = 0;

        _mockPolicyRepository
            .Setup(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Policy>());

        _mockPolicyRepository
            .Setup(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(totalActiveUsers);

        // Act
        var result = await _service.GetAcceptStatsAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);

        // Verify method calls
        _mockPolicyRepository.Verify(r => r.GetRequiredPoliciesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CountActiveUsersAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockPolicyRepository.Verify(r => r.CountAcceptedUsersAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
