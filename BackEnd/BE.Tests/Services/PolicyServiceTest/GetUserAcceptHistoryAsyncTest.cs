using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetUserAcceptHistoryAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_USER_ACCEPT_HISTORY.txt
/// </summary>
public class GetUserAcceptHistoryAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetUserAcceptHistoryAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - User has no accept history
    /// Expected: Returns empty list
    /// </summary>
    [Fact]
    public async Task UTCID01_GetUserAcceptHistoryAsync_NoHistory_ReturnsEmptyList()
    {
        // Arrange
        int userId = 1;

        _mockPolicyRepository
            .Setup(r => r.GetUserAcceptHistoryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.GetUserAcceptHistoryAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<List<UserAcceptHistoryResponse>>(result);
        Assert.Empty(result);

        // Verify repository call
        _mockPolicyRepository.Verify(r => r.GetUserAcceptHistoryAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - User has 1 accept history (valid)
    /// Expected: Returns list with 1 UserAcceptHistoryResponse
    /// </summary>
    [Fact]
    public async Task UTCID02_GetUserAcceptHistoryAsync_OneValidAccept_ReturnsOneRecord()
    {
        // Arrange
        int userId = 1;
        var acceptedAt = DateTime.Now.AddDays(-7);

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service"
        };

        var version = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 2,
            Title = "Version 2.0",
            Policy = policy
        };

        var accept = new UserPolicyAccept
        {
            AcceptId = 101,
            UserId = userId,
            PolicyVersionId = 1,
            AcceptedAt = acceptedAt,
            IsValid = true,
            InvalidatedAt = null,
            PolicyVersion = version
        };

        _mockPolicyRepository
            .Setup(r => r.GetUserAcceptHistoryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept> { accept });

        // Act
        var result = await _service.GetUserAcceptHistoryAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);

        var history = result[0];
        Assert.Equal(101, history.AcceptId);
        Assert.Equal("TERMS", history.PolicyCode);
        Assert.Equal("Terms of Service", history.PolicyName);
        Assert.Equal(2, history.VersionNumber);
        Assert.Equal("Version 2.0", history.VersionTitle);
        Assert.Equal(acceptedAt, history.AcceptedAt);
        Assert.True(history.IsValid);
        Assert.Null(history.InvalidatedAt);
    }

    /// <summary>
    /// UTCID03: Normal case - User has multiple accepts (all valid)
    /// Expected: Returns list with multiple UserAcceptHistoryResponse
    /// </summary>
    [Fact]
    public async Task UTCID03_GetUserAcceptHistoryAsync_MultipleValidAccepts_ReturnsMultipleRecords()
    {
        // Arrange
        int userId = 1;

        var policy1 = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms of Service" };
        var policy2 = new Policy { PolicyId = 2, PolicyCode = "PRIVACY", PolicyName = "Privacy Policy" };

        var version1 = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Terms v1",
            Policy = policy1
        };

        var version2 = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 2,
            VersionNumber = 1,
            Title = "Privacy v1",
            Policy = policy2
        };

        var accept1 = new UserPolicyAccept
        {
            AcceptId = 101,
            UserId = userId,
            PolicyVersionId = 1,
            AcceptedAt = DateTime.Now.AddDays(-10),
            IsValid = true,
            PolicyVersion = version1
        };

        var accept2 = new UserPolicyAccept
        {
            AcceptId = 102,
            UserId = userId,
            PolicyVersionId = 2,
            AcceptedAt = DateTime.Now.AddDays(-5),
            IsValid = true,
            PolicyVersion = version2
        };

        _mockPolicyRepository
            .Setup(r => r.GetUserAcceptHistoryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept> { accept1, accept2 });

        // Act
        var result = await _service.GetUserAcceptHistoryAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        // Verify first accept
        Assert.Equal(101, result[0].AcceptId);
        Assert.Equal("TERMS", result[0].PolicyCode);
        Assert.True(result[0].IsValid);

        // Verify second accept
        Assert.Equal(102, result[1].AcceptId);
        Assert.Equal("PRIVACY", result[1].PolicyCode);
        Assert.True(result[1].IsValid);
    }

    /// <summary>
    /// UTCID04: Normal case - User has mix of valid and invalid accepts
    /// Expected: Returns all accepts with correct IsValid and InvalidatedAt values
    /// </summary>
    [Fact]
    public async Task UTCID04_GetUserAcceptHistoryAsync_MixedValidInvalid_ReturnsAllWithCorrectStatus()
    {
        // Arrange
        int userId = 1;
        var invalidatedDate = DateTime.Now.AddDays(-2);

        var policy = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms of Service" };

        var oldVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Version 1.0",
            Policy = policy
        };

        var newVersion = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 1,
            VersionNumber = 2,
            Title = "Version 2.0",
            Policy = policy
        };

        // Old accept - now invalid
        var invalidAccept = new UserPolicyAccept
        {
            AcceptId = 101,
            UserId = userId,
            PolicyVersionId = 1,
            AcceptedAt = DateTime.Now.AddDays(-30),
            IsValid = false,
            InvalidatedAt = invalidatedDate,
            PolicyVersion = oldVersion
        };

        // New accept - still valid
        var validAccept = new UserPolicyAccept
        {
            AcceptId = 102,
            UserId = userId,
            PolicyVersionId = 2,
            AcceptedAt = DateTime.Now.AddDays(-1),
            IsValid = true,
            InvalidatedAt = null,
            PolicyVersion = newVersion
        };

        _mockPolicyRepository
            .Setup(r => r.GetUserAcceptHistoryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept> { invalidAccept, validAccept });

        // Act
        var result = await _service.GetUserAcceptHistoryAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        // Verify invalid accept
        var invalidHistory = result[0];
        Assert.Equal(101, invalidHistory.AcceptId);
        Assert.Equal(1, invalidHistory.VersionNumber);
        Assert.False(invalidHistory.IsValid);
        Assert.Equal(invalidatedDate, invalidHistory.InvalidatedAt);

        // Verify valid accept
        var validHistory = result[1];
        Assert.Equal(102, validHistory.AcceptId);
        Assert.Equal(2, validHistory.VersionNumber);
        Assert.True(validHistory.IsValid);
        Assert.Null(validHistory.InvalidatedAt);
    }

    /// <summary>
    /// UTCID05: Normal case - Different user with multiple accepts
    /// Expected: Returns only accepts for specified userId
    /// </summary>
    [Fact]
    public async Task UTCID05_GetUserAcceptHistoryAsync_DifferentUser_ReturnsOnlyUserAccepts()
    {
        // Arrange
        int userId = 999;

        var policy = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var version = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Version 1",
            Policy = policy
        };

        var accept1 = new UserPolicyAccept
        {
            AcceptId = 201,
            UserId = userId,
            PolicyVersionId = 1,
            AcceptedAt = DateTime.Now.AddDays(-5),
            IsValid = true,
            PolicyVersion = version
        };

        var accept2 = new UserPolicyAccept
        {
            AcceptId = 202,
            UserId = userId,
            PolicyVersionId = 1,
            AcceptedAt = DateTime.Now.AddDays(-3),
            IsValid = true,
            PolicyVersion = version
        };

        _mockPolicyRepository
            .Setup(r => r.GetUserAcceptHistoryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept> { accept1, accept2 });

        // Act
        var result = await _service.GetUserAcceptHistoryAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.All(result, h => Assert.Equal("TERMS", h.PolicyCode));
    }

    /// <summary>
    /// UTCID06: Abnormal case - userId: 0
    /// Expected: Returns empty list (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID06_GetUserAcceptHistoryAsync_UserIdZero_ReturnsEmptyList()
    {
        // Arrange
        int userId = 0;

        _mockPolicyRepository
            .Setup(r => r.GetUserAcceptHistoryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.GetUserAcceptHistoryAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    /// <summary>
    /// UTCID07: Abnormal case - userId: -1 (negative)
    /// Expected: Returns empty list (handles gracefully)
    /// </summary>
    [Fact]
    public async Task UTCID07_GetUserAcceptHistoryAsync_NegativeUserId_ReturnsEmptyList()
    {
        // Arrange
        int userId = -1;

        _mockPolicyRepository
            .Setup(r => r.GetUserAcceptHistoryAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<UserPolicyAccept>());

        // Act
        var result = await _service.GetUserAcceptHistoryAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
