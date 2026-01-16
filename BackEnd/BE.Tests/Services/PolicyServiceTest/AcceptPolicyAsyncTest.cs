using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.AcceptPolicyAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_ACCEPT_POLICY.txt
/// </summary>
public class AcceptPolicyAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public AcceptPolicyAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - User accepts valid policy with correct version
    /// Expected: Creates accept, invalidates old accepts, returns PolicyStatusResponse
    /// </summary>
    [Fact]
    public async Task UTCID01_AcceptPolicyAsync_ValidPolicyAndVersion_CreatesAcceptAndReturnsStatus()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = "TERMS",
            VersionNumber = 2
        };

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

        // Mock for CheckPolicyStatusAsync internal call
        _mockPolicyRepository
            .Setup(r => r.GetActiveRequiredVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyVersion>());

        _mockPolicyRepository
            .Setup(r => r.GetUserValidAcceptsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.AcceptPolicyAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyStatusResponse>(result);

        // Verify repository calls
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.HasUserAcceptedVersionAsync(userId, 1, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.InvalidateOldAcceptsAsync(userId, 1, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(
            It.Is<UserPolicyAccept>(a => 
                a.UserId == userId && 
                a.PolicyVersionId == 1 && 
                a.IsValid == true), 
            It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - Version number mismatch
    /// Expected: Throws InvalidOperationException with version message
    /// </summary>
    [Fact]
    public async Task UTCID02_AcceptPolicyAsync_VersionMismatch_ThrowsInvalidOperationException()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = "TERMS",
            VersionNumber = 1 // User trying to accept old version
        };

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service"
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 1,
            VersionNumber = 2, // Current active version is 2
            Status = "ACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.AcceptPolicyAsync(userId, request));

        Assert.Contains("Version không hợp lệ", exception.Message);
        Assert.Contains("2", exception.Message); // Should mention current version

        // Verify no accept was created
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Normal case - User already accepted this version
    /// Expected: Throws InvalidOperationException with already accepted message
    /// </summary>
    [Fact]
    public async Task UTCID03_AcceptPolicyAsync_AlreadyAccepted_ThrowsInvalidOperationException()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = "TERMS",
            VersionNumber = 2
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
            VersionNumber = 2,
            Status = "ACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        _mockPolicyRepository
            .Setup(r => r.HasUserAcceptedVersionAsync(userId, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true); // User already accepted

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.AcceptPolicyAsync(userId, request));

        Assert.Contains("Bạn đã xác nhận chính sách này rồi", exception.Message);

        // Verify no accept was created
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockPolicyRepository.Verify(r => r.InvalidateOldAcceptsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID04: Normal case - Policy code does not exist or not active
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_AcceptPolicyAsync_PolicyNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = "INVALID",
            VersionNumber = 1
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("INVALID", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.AcceptPolicyAsync(userId, request));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
        Assert.Contains("'INVALID'", exception.Message);

        // Verify no accept was created
        _mockPolicyRepository.Verify(r => r.CreateAcceptAsync(It.IsAny<UserPolicyAccept>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID05: Abnormal case - userId: 0
    /// Expected: Throws KeyNotFoundException (no active policy for invalid user)
    /// </summary>
    [Fact]
    public async Task UTCID05_AcceptPolicyAsync_UserIdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        int userId = 0;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = "TERMS",
            VersionNumber = 1
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.AcceptPolicyAsync(userId, request));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
    }

    /// <summary>
    /// UTCID06: Abnormal case - userId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_AcceptPolicyAsync_NegativeUserId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int userId = -1;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = "TERMS",
            VersionNumber = 1
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.AcceptPolicyAsync(userId, request));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
    }

    /// <summary>
    /// UTCID07: Boundary case - userId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID07_AcceptPolicyAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int userId = int.MaxValue;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = "TERMS",
            VersionNumber = 1
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("TERMS", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.AcceptPolicyAsync(userId, request));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
    }

    /// <summary>
    /// UTCID08: Abnormal case - PolicyCode: null
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID08_AcceptPolicyAsync_NullPolicyCode_ThrowsKeyNotFoundException()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = null!,
            VersionNumber = 1
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.AcceptPolicyAsync(userId, request));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
    }

    /// <summary>
    /// UTCID09: Abnormal case - PolicyCode: "" (empty)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID09_AcceptPolicyAsync_EmptyPolicyCode_ThrowsKeyNotFoundException()
    {
        // Arrange
        int userId = 1;
        var request = new AcceptPolicyRequest
        {
            PolicyCode = "",
            VersionNumber = 1
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync("", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.AcceptPolicyAsync(userId, request));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
    }
}
