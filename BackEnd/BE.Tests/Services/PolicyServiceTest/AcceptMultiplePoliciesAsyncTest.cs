using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.AcceptMultiplePoliciesAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_ACCEPT_MULTIPLE_POLICIES.txt
/// </summary>
public class AcceptMultiplePoliciesAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public AcceptMultiplePoliciesAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - Empty policies list
    /// Expected: Returns PolicyStatusResponse without processing any accepts
    /// </summary>
    [Fact]
    public async Task UTCID01_AcceptMultiplePoliciesAsync_EmptyList_ReturnsStatusWithoutProcessing()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptMultiplePoliciesRequest
        {
            Policies = new List<AcceptPolicyRequest>()
        };

        // Mock for CheckPolicyStatusAsync
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.AcceptMultiplePoliciesAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);

        // Verify AcceptPolicyAsync was never called (no policies to accept)
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()), Times.Never);

        // Verify CheckPolicyStatusAsync was called
        _mockPolicyRepository.Verify(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - Single policy in list, all valid
    /// Expected: Accepts single policy and returns status
    /// </summary>
    [Fact]
    public async Task UTCID02_AcceptMultiplePoliciesAsync_SinglePolicy_AcceptsAndReturnsStatus()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptMultiplePoliciesRequest
        {
            Policies = new List<AcceptPolicyRequest>
            {
                new AcceptPolicyRequest { PolicyCode = "TERMS", VersionNumber = 1 }
            }
        };

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service"
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "ACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        _mockPolicyRepository
            .Setup(r => r.HasUserAcceptedVersionAsync(userId, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockPolicyRepository
            .Setup(r => r.InvalidateOldAcceptsAsync(userId, 1, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockPolicyRepository
            .Setup(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserPolicyAccept accept, CancellationToken ct) => accept);

        // Mock for CheckPolicyStatusAsync
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.AcceptMultiplePoliciesAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);

        // Verify AcceptPolicyAsync was called once
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID03: Normal case - Multiple policies, all valid
    /// Expected: Accepts all policies and returns status
    /// </summary>
    [Fact]
    public async Task UTCID03_AcceptMultiplePoliciesAsync_MultiplePolicies_AcceptsAllAndReturnsStatus()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptMultiplePoliciesRequest
        {
            Policies = new List<AcceptPolicyRequest>
            {
                new AcceptPolicyRequest { PolicyCode = "TERMS", VersionNumber = 1 },
                new AcceptPolicyRequest { PolicyCode = "PRIVACY", VersionNumber = 2 }
            }
        };

        var policy1 = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var policy2 = new Policy { PolicyId = 2, PolicyCode = "PRIVACY", PolicyName = "Privacy" };

        var version1 = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "ACTIVE",
            Policy = policy1
        };

        var version2 = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 2,
            VersionNumber = 2,
            Status = "ACTIVE",
            Policy = policy2
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()))
            .ReturnsAsync(version1);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("PRIVACY", It.IsAny<CancellationToken>()))
            .ReturnsAsync(version2);

        _mockPolicyRepository
            .Setup(r => r.HasUserAcceptedVersionAsync(userId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockPolicyRepository
            .Setup(r => r.InvalidateOldAcceptsAsync(userId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockPolicyRepository
            .Setup(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserPolicyAccept accept, CancellationToken ct) => accept);

        // Mock for CheckPolicyStatusAsync
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.AcceptMultiplePoliciesAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);

        // Verify AcceptPolicyAsync was called for both policies
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync("PRIVACY", It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    /// <summary>
    /// UTCID04: Normal case - Multiple policies, some already accepted (InvalidOperationException caught)
    /// Expected: Skips already accepted, accepts others, returns status
    /// </summary>
    [Fact]
    public async Task UTCID04_AcceptMultiplePoliciesAsync_SomeAlreadyAccepted_SkipsAndContinues()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptMultiplePoliciesRequest
        {
            Policies = new List<AcceptPolicyRequest>
            {
                new AcceptPolicyRequest { PolicyCode = "TERMS", VersionNumber = 1 },
                new AcceptPolicyRequest { PolicyCode = "PRIVACY", VersionNumber = 1 }
            }
        };

        var policy1 = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var policy2 = new Policy { PolicyId = 2, PolicyCode = "PRIVACY", PolicyName = "Privacy" };

        var version1 = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "ACTIVE",
            Policy = policy1
        };

        var version2 = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 2,
            VersionNumber = 1,
            Status = "ACTIVE",
            Policy = policy2
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()))
            .ReturnsAsync(version1);

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("PRIVACY", It.IsAny<CancellationToken>()))
            .ReturnsAsync(version2);

        // First policy already accepted
        _mockPolicyRepository
            .Setup(r => r.HasUserAcceptedVersionAsync(userId, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Second policy not accepted yet
        _mockPolicyRepository
            .Setup(r => r.HasUserAcceptedVersionAsync(userId, 2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockPolicyRepository
            .Setup(r => r.InvalidateOldAcceptsAsync(userId, 2, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _mockPolicyRepository
            .Setup(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserPolicyAccept accept, CancellationToken ct) => accept);

        // Mock for CheckPolicyStatusAsync
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.AcceptMultiplePoliciesAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);

        // Verify both policies were checked
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync("PRIVACY", It.IsAny<CancellationToken>()), Times.Once);

        // Verify only second policy was created (first was already accepted)
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(
            It.Is<UserPolicyAccept>(a => a.PolicyVersionId == 2),
            It.IsAny<CancellationToken>()), Times.Once);

        // Verify first policy was not created
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(
            It.Is<UserPolicyAccept>(a => a.PolicyVersionId == 1),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID05: Abnormal case - userId: 0
    /// Expected: Returns PolicyStatusResponse (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID05_AcceptMultiplePoliciesAsync_UserIdZero_ReturnsStatus()
    {
        // Arrange
        int userId = 0;
        var request = new AcceptMultiplePoliciesRequest
        {
            Policies = new List<AcceptPolicyRequest>()
        };

        // Mock for CheckPolicyStatusAsync
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.AcceptMultiplePoliciesAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);
    }

    /// <summary>
    /// UTCID06: Abnormal case - userId: -1 (negative)
    /// Expected: Returns PolicyStatusResponse (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID06_AcceptMultiplePoliciesAsync_NegativeUserId_ReturnsStatus()
    {
        // Arrange
        int userId = -1;
        var request = new AcceptMultiplePoliciesRequest
        {
            Policies = new List<AcceptPolicyRequest>()
        };

        // Mock for CheckPolicyStatusAsync
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.AcceptMultiplePoliciesAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);
    }

    /// <summary>
    /// UTCID07: Boundary case - userId: int.MaxValue
    /// Expected: Returns PolicyStatusResponse (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID07_AcceptMultiplePoliciesAsync_IntMaxValue_ReturnsStatus()
    {
        // Arrange
        int userId = int.MaxValue;
        var request = new AcceptMultiplePoliciesRequest
        {
            Policies = new List<AcceptPolicyRequest>()
        };

        // Mock for CheckPolicyStatusAsync
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.AcceptMultiplePoliciesAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);
    }
}
