using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.CheckPolicyStatusAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_CHECK_POLICY_STATUS.txt
/// </summary>
public class CheckPolicyStatusAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public CheckPolicyStatusAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - User has accepted all required policies (compliant)
    /// Expected: Returns PolicyStatusResponse with IsCompliant=true, Status="ACTIVE"
    /// </summary>
    [Fact]
    public async Task UTCID01_CheckPolicyStatusAsync_UserAcceptedAll_ReturnsCompliantStatus()
    {
        // Arrange
        int userId = 1;

        // Setup: No required versions or all are accepted
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.CheckPolicyStatusAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);
        Assert.True(result.IsCompliant);
        Assert.Equal("ACTIVE", result.Status);
        Assert.Equal("Người dùng đã xác nhận đầy đủ các điều khoản", result.Message);
        Assert.NotNull(result.PendingPolicies);
        Assert.Empty(result.PendingPolicies);

        // Verify repository calls
        _mockPolicyRepository.Verify(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - User has 1 pending policy (not compliant)
    /// Expected: Returns PolicyStatusResponse with IsCompliant=false, Status="PENDING_POLICY"
    /// </summary>
    [Fact]
    public async Task UTCID02_CheckPolicyStatusAsync_UserHasOnePending_ReturnsNonCompliantStatus()
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
        var result = await _service.CheckPolicyStatusAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsCompliant);
        Assert.Equal("PENDING_POLICY", result.Status);
        Assert.Equal("Người dùng cần xác nhận điều khoản để tiếp tục sử dụng", result.Message);
        Assert.NotNull(result.PendingPolicies);
        Assert.Single(result.PendingPolicies);

        var pendingPolicy = result.PendingPolicies[0];
        Assert.Equal("TERMS", pendingPolicy.PolicyCode);
        Assert.Equal("Terms of Service", pendingPolicy.PolicyName);
        Assert.Equal(2, pendingPolicy.VersionNumber);
        Assert.Equal("Version 2.0", pendingPolicy.Title);
    }

    /// <summary>
    /// UTCID03: Normal case - User has multiple pending policies (not compliant)
    /// Expected: Returns PolicyStatusResponse with multiple pending policies
    /// </summary>
    [Fact]
    public async Task UTCID03_CheckPolicyStatusAsync_UserHasMultiplePending_ReturnsNonCompliantWithMultiple()
    {
        // Arrange
        int userId = 999;

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

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion> { version1, version2 });

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>()); // User has not accepted any

        // Act
        var result = await _service.CheckPolicyStatusAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsCompliant);
        Assert.Equal("PENDING_POLICY", result.Status);
        Assert.Equal("Người dùng cần xác nhận điều khoản để tiếp tục sử dụng", result.Message);
        Assert.NotNull(result.PendingPolicies);
        Assert.Equal(2, result.PendingPolicies.Count);

        // Verify policies are ordered by DisplayOrder
        Assert.Equal("TERMS", result.PendingPolicies[0].PolicyCode);
        Assert.Equal("PRIVACY", result.PendingPolicies[1].PolicyCode);
    }

    /// <summary>
    /// UTCID04: Abnormal case - userId: 0
    /// Expected: Returns compliant status (no required policies for invalid user)
    /// </summary>
    [Fact]
    public async Task UTCID04_CheckPolicyStatusAsync_UserIdZero_ReturnsCompliantStatus()
    {
        // Arrange
        int userId = 0;

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.CheckPolicyStatusAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsCompliant);
        Assert.Equal("ACTIVE", result.Status);
        Assert.Empty(result.PendingPolicies);
    }

    /// <summary>
    /// UTCID05: Abnormal case - userId: -1 (negative)
    /// Expected: Returns compliant status (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID05_CheckPolicyStatusAsync_NegativeUserId_ReturnsCompliantStatus()
    {
        // Arrange
        int userId = -1;

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.CheckPolicyStatusAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsCompliant);
        Assert.Equal("ACTIVE", result.Status);
        Assert.Empty(result.PendingPolicies);
    }

    /// <summary>
    /// UTCID06: Boundary case - userId: int.MaxValue
    /// Expected: Returns compliant status (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID06_CheckPolicyStatusAsync_IntMaxValue_ReturnsCompliantStatus()
    {
        // Arrange
        int userId = int.MaxValue;

        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.CheckPolicyStatusAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsCompliant);
        Assert.Equal("ACTIVE", result.Status);
        Assert.Empty(result.PendingPolicies);
    }
}
