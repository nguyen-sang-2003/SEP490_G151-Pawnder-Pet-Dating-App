using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetPendingPoliciesAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_PENDING_POLICIES.txt
/// </summary>
public class GetPendingPoliciesAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetPendingPoliciesAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - No active required versions (or user accepted all)
    /// Expected: Returns empty list
    /// </summary>
    [Fact]
    public async Task UTCID01_GetPendingPoliciesAsync_NoRequiredVersions_ReturnsEmptyList()
    {
        // Arrange
        int userId = 1;

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.GetPendingPoliciesAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<List<PendingPolicyResponse>>(result);
        Assert.Empty(result);

        // Verify repository calls
        _mockPolicyRepository.Verify(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - 1 required version, user has not accepted
    /// Expected: Returns list with 1 pending policy, HasPreviousAccept=false
    /// </summary>
    [Fact]
    public async Task UTCID02_GetPendingPoliciesAsync_OneVersionNotAccepted_ReturnsOnePending()
    {
        // Arrange
        int userId = 1;

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            Description = "Terms Description",
            DisplayOrder = 1,
            RequireConsent = true
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 2,
            Title = "Version 2.0",
            Content = "Updated terms",
            ChangeLog = "Major update",
            Status = "ACTIVE",
            PublishedAt = DateTime.Now,
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { activeVersion });

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>()); // User has not accepted

        // Act
        var result = await _service.GetPendingPoliciesAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var pending = result[0];
        Assert.Equal("TERMS", pending.PolicyCode);
        Assert.Equal("Terms of Service", pending.PolicyName);
        Assert.Equal("Terms Description", pending.Description);
        Assert.Equal(1, pending.DisplayOrder);
        Assert.Equal(2, pending.VersionNumber);
        Assert.Equal("Version 2.0", pending.Title);
        Assert.Equal("Updated terms", pending.Content);
        Assert.Equal("Major update", pending.ChangeLog);
        Assert.False(pending.HasPreviousAccept);
        Assert.Null(pending.PreviousAcceptVersion);
    }

    /// <summary>
    /// UTCID03: Normal case - 1 required version, user has already accepted
    /// Expected: Returns empty list (no pending)
    /// </summary>
    [Fact]
    public async Task UTCID03_GetPendingPoliciesAsync_OneVersionAccepted_ReturnsEmptyList()
    {
        // Arrange
        int userId = 1;

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

        var userAccept = new UserPolicyAccept
        {
            AcceptId = 1,
            UserId = userId,
            PolicyVersionId = 1,
            IsValid = true,
            PolicyVersion = activeVersion
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { activeVersion });

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept> { userAccept });

        // Act
        var result = await _service.GetPendingPoliciesAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    /// <summary>
    /// UTCID04: Normal case - Multiple versions, user has previous accept (now invalid)
    /// Expected: Returns pending with HasPreviousAccept=true
    /// </summary>
    [Fact]
    public async Task UTCID04_GetPendingPoliciesAsync_HasPreviousInvalidAccept_ReturnsPendingWithPreviousInfo()
    {
        // Arrange
        int userId = 1;

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            DisplayOrder = 1,
            RequireConsent = true
        };

        var oldVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "INACTIVE",
            Policy = policy
        };

        var newActiveVersion = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 1,
            VersionNumber = 2,
            Title = "Version 2.0",
            Content = "New content",
            Status = "ACTIVE",
            Policy = policy
        };

        // User accepted old version but it's now invalid
        var invalidAccept = new UserPolicyAccept
        {
            AcceptId = 1,
            UserId = userId,
            PolicyVersionId = 1,
            IsValid = false, // Invalidated
            PolicyVersion = oldVersion
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { newActiveVersion });

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept> { invalidAccept });

        // Act
        var result = await _service.GetPendingPoliciesAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var pending = result[0];
        Assert.Equal("TERMS", pending.PolicyCode);
        Assert.Equal(2, pending.VersionNumber);
        Assert.True(pending.HasPreviousAccept);
        Assert.Equal(1, pending.PreviousAcceptVersion);
    }

    /// <summary>
    /// UTCID05: Normal case - Multiple required versions, user accepted none, verify ordering
    /// Expected: Returns multiple pending policies ordered by DisplayOrder
    /// </summary>
    [Fact]
    public async Task UTCID05_GetPendingPoliciesAsync_MultiplePendingVersions_ReturnsOrderedByDisplayOrder()
    {
        // Arrange
        int userId = 999;

        var policy1 = new Policy
        {
            PolicyId = 1,
            PolicyCode = "PRIVACY",
            PolicyName = "Privacy Policy",
            DisplayOrder = 2, // Higher display order
            RequireConsent = true
        };

        var policy2 = new Policy
        {
            PolicyId = 2,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            DisplayOrder = 1, // Lower display order (should be first)
            RequireConsent = true
        };

        var version1 = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Privacy v1",
            Content = "Privacy content",
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

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { version1, version2 });

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.GetPendingPoliciesAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        // Verify ordering by DisplayOrder
        Assert.Equal("TERMS", result[0].PolicyCode); // DisplayOrder = 1
        Assert.Equal(1, result[0].DisplayOrder);
        Assert.Equal("PRIVACY", result[1].PolicyCode); // DisplayOrder = 2
        Assert.Equal(2, result[1].DisplayOrder);
    }

    /// <summary>
    /// UTCID06: Abnormal case - userId: 0
    /// Expected: Returns list (handles gracefully, likely empty if no accepts)
    /// </summary>
    [Fact]
    public async Task UTCID06_GetPendingPoliciesAsync_UserIdZero_ReturnsListGracefully()
    {
        // Arrange
        int userId = 0;

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms",
            DisplayOrder = 1
        };

        var version = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Version 1",
            Content = "Content",
            Status = "ACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { version });

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.GetPendingPoliciesAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result); // User 0 has not accepted, so it's pending
    }

    /// <summary>
    /// UTCID07: Abnormal case - userId: -1 (negative)
    /// Expected: Returns list (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID07_GetPendingPoliciesAsync_NegativeUserId_ReturnsListGracefully()
    {
        // Arrange
        int userId = -1;

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms",
            DisplayOrder = 1
        };

        var version = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Version 1",
            Content = "Content",
            Status = "ACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { version });

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.GetPendingPoliciesAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result); // Negative user has not accepted
    }

    /// <summary>
    /// UTCID08: Boundary case - userId: int.MaxValue
    /// Expected: Returns list (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID08_GetPendingPoliciesAsync_IntMaxValue_ReturnsListGracefully()
    {
        // Arrange
        int userId = int.MaxValue;

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms",
            DisplayOrder = 1
        };

        var version = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Version 1",
            Content = "Content",
            Status = "ACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { version });

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.GetPendingPoliciesAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result); // int.MaxValue user has not accepted
    }
}
