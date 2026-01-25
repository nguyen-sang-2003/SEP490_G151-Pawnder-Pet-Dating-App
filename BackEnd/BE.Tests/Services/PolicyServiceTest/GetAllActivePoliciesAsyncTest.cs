using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetAllActivePoliciesAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_ALL_ACTIVE_POLICIES.txt
/// </summary>
public class GetAllActivePoliciesAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetAllActivePoliciesAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - No active required policies
    /// Expected: Returns empty list
    /// </summary>
    [Fact]
    public async Task UTCID01_GetAllActivePoliciesAsync_NoPolicies_ReturnsEmptyList()
    {
        // Arrange
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        // Act
        var result = await _service.GetAllActivePoliciesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.IsType<List<PendingPolicyResponse>>(result);
        Assert.Empty(result);

        // Verify repository call
        _mockPolicyRepository.Verify(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - One active required policy
    /// Expected: Returns list with 1 PendingPolicyResponse with all properties mapped
    /// </summary>
    [Fact]
    public async Task UTCID02_GetAllActivePoliciesAsync_OnePolicy_ReturnsOnePolicyResponse()
    {
        // Arrange
        var publishedAt = DateTime.Now.AddDays(-30);

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            Description = "Terms and conditions",
            DisplayOrder = 1,
            RequireConsent = true
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 2,
            Title = "Version 2.0",
            Content = "Full terms content...",
            ChangeLog = "Updated clauses",
            Status = "ACTIVE",
            PublishedAt = publishedAt,
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { activeVersion });

        // Act
        var result = await _service.GetAllActivePoliciesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var policyResponse = result[0];
        Assert.Equal("TERMS", policyResponse.PolicyCode);
        Assert.Equal("Terms of Service", policyResponse.PolicyName);
        Assert.Equal("Terms and conditions", policyResponse.Description);
        Assert.Equal(1, policyResponse.DisplayOrder);
        Assert.Equal(2, policyResponse.VersionNumber);
        Assert.Equal("Version 2.0", policyResponse.Title);
        Assert.Equal("Full terms content...", policyResponse.Content);
        Assert.Equal("Updated clauses", policyResponse.ChangeLog);
        Assert.Equal(publishedAt, policyResponse.PublishedAt);
        Assert.False(policyResponse.HasPreviousAccept);
        Assert.Null(policyResponse.PreviousAcceptVersion);
    }

    /// <summary>
    /// UTCID03: Normal case - Multiple active policies, already ordered
    /// Expected: Returns multiple policies ordered by DisplayOrder
    /// </summary>
    [Fact]
    public async Task UTCID03_GetAllActivePoliciesAsync_MultiplePoliciesOrdered_ReturnsOrderedList()
    {
        // Arrange
        var policy1 = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            DisplayOrder = 1,
            RequireConsent = true
        };

        var policy2 = new Policy
        {
            PolicyId = 2,
            PolicyCode = "PRIVACY",
            PolicyName = "Privacy Policy",
            DisplayOrder = 2,
            RequireConsent = true
        };

        var policy3 = new Policy
        {
            PolicyId = 3,
            PolicyCode = "COOKIE",
            PolicyName = "Cookie Policy",
            DisplayOrder = 3,
            RequireConsent = true
        };

        var version1 = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Terms v1",
            Content = "Terms content",
            Status = "ACTIVE",
            Policy = policy1
        };

        var version2 = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 2,
            VersionNumber = 1,
            Title = "Privacy v1",
            Content = "Privacy content",
            Status = "ACTIVE",
            Policy = policy2
        };

        var version3 = new PolicyVersion
        {
            PolicyVersionId = 3,
            PolicyId = 3,
            VersionNumber = 1,
            Title = "Cookie v1",
            Content = "Cookie content",
            Status = "ACTIVE",
            Policy = policy3
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { version1, version2, version3 });

        // Act
        var result = await _service.GetAllActivePoliciesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);

        // Verify ordering by DisplayOrder
        Assert.Equal("TERMS", result[0].PolicyCode);
        Assert.Equal(1, result[0].DisplayOrder);
        Assert.Equal("PRIVACY", result[1].PolicyCode);
        Assert.Equal(2, result[1].DisplayOrder);
        Assert.Equal("COOKIE", result[2].PolicyCode);
        Assert.Equal(3, result[2].DisplayOrder);

        // Verify all have default values for HasPreviousAccept and PreviousAcceptVersion
        Assert.All(result, p => Assert.False(p.HasPreviousAccept));
        Assert.All(result, p => Assert.Null(p.PreviousAcceptVersion));
    }

    /// <summary>
    /// UTCID04: Normal case - Multiple policies with unordered DisplayOrder
    /// Expected: Returns policies ordered by DisplayOrder (ascending)
    /// </summary>
    [Fact]
    public async Task UTCID04_GetAllActivePoliciesAsync_UnorderedPolicies_ReturnsOrderedByDisplayOrder()
    {
        // Arrange - Create policies with unordered DisplayOrder
        var policy1 = new Policy
        {
            PolicyId = 1,
            PolicyCode = "COOKIE",
            PolicyName = "Cookie Policy",
            DisplayOrder = 3, // Highest
            RequireConsent = true
        };

        var policy2 = new Policy
        {
            PolicyId = 2,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            DisplayOrder = 1, // Lowest
            RequireConsent = true
        };

        var policy3 = new Policy
        {
            PolicyId = 3,
            PolicyCode = "PRIVACY",
            PolicyName = "Privacy Policy",
            DisplayOrder = 2, // Middle
            RequireConsent = true
        };

        var version1 = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Cookie v1",
            Content = "Cookie content",
            Status = "ACTIVE",
            Policy = policy1
        };

        var version2 = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 2,
            VersionNumber = 1,
            Title = "Terms v1",
            Content = "Terms content",
            Status = "ACTIVE",
            Policy = policy2
        };

        var version3 = new PolicyVersion
        {
            PolicyVersionId = 3,
            PolicyId = 3,
            VersionNumber = 1,
            Title = "Privacy v1",
            Content = "Privacy content",
            Status = "ACTIVE",
            Policy = policy3
        };

        // Repository returns in unordered sequence
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { version1, version2, version3 });

        // Act
        var result = await _service.GetAllActivePoliciesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);

        // Verify ordering by DisplayOrder (ascending)
        Assert.Equal("TERMS", result[0].PolicyCode);
        Assert.Equal(1, result[0].DisplayOrder);
        Assert.Equal("PRIVACY", result[1].PolicyCode);
        Assert.Equal(2, result[1].DisplayOrder);
        Assert.Equal("COOKIE", result[2].PolicyCode);
        Assert.Equal(3, result[2].DisplayOrder);

        // Verify first item has lowest DisplayOrder
        Assert.True(result[0].DisplayOrder <= result[1].DisplayOrder);
        Assert.True(result[1].DisplayOrder <= result[2].DisplayOrder);
    }
}
