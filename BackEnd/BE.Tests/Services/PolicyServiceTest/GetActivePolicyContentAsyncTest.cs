using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.GetActivePolicyContentAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_GET_ACTIVE_POLICY_CONTENT.txt
/// </summary>
public class GetActivePolicyContentAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public GetActivePolicyContentAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - Get active "TERMS" policy content
    /// Expected: Returns PendingPolicyResponse with all policy and version details
    /// </summary>
    [Fact]
    public async Task UTCID01_GetActivePolicyContentAsync_TermsPolicy_ReturnsPolicyContent()
    {
        // Arrange
        string policyCode = "TERMS";
        var publishedAt = DateTime.Now.AddDays(-30);

        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service",
            Description = "Terms and conditions for using the service",
            DisplayOrder = 1,
            RequireConsent = true
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 1,
            PolicyId = 1,
            VersionNumber = 2,
            Title = "Version 2.0 - Updated Terms",
            Content = "Full terms content here...",
            ChangeLog = "Updated privacy clauses",
            Status = "ACTIVE",
            PublishedAt = publishedAt,
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync(policyCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        // Act
        var result = await _service.GetActivePolicyContentAsync(policyCode);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PendingPolicyResponse>(result);
        Assert.Equal("TERMS", result.PolicyCode);
        Assert.Equal("Terms of Service", result.PolicyName);
        Assert.Equal("Terms and conditions for using the service", result.Description);
        Assert.Equal(1, result.DisplayOrder);
        Assert.Equal(2, result.VersionNumber);
        Assert.Equal("Version 2.0 - Updated Terms", result.Title);
        Assert.Equal("Full terms content here...", result.Content);
        Assert.Equal("Updated privacy clauses", result.ChangeLog);
        Assert.Equal(publishedAt, result.PublishedAt);
        Assert.False(result.HasPreviousAccept);
        Assert.Null(result.PreviousAcceptVersion);

        // Verify repository call
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync(policyCode, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - Get active "PRIVACY" policy content
    /// Expected: Returns PendingPolicyResponse with all policy and version details
    /// </summary>
    [Fact]
    public async Task UTCID02_GetActivePolicyContentAsync_PrivacyPolicy_ReturnsPolicyContent()
    {
        // Arrange
        string policyCode = "PRIVACY";
        var publishedAt = DateTime.Now.AddDays(-15);

        var policy = new Policy
        {
            PolicyId = 2,
            PolicyCode = "PRIVACY",
            PolicyName = "Privacy Policy",
            Description = "How we handle your data",
            DisplayOrder = 2,
            RequireConsent = true
        };

        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = 2,
            PolicyId = 2,
            VersionNumber = 1,
            Title = "Privacy Policy v1.0",
            Content = "We respect your privacy...",
            ChangeLog = "Initial version",
            Status = "ACTIVE",
            PublishedAt = publishedAt,
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync(policyCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        // Act
        var result = await _service.GetActivePolicyContentAsync(policyCode);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("PRIVACY", result.PolicyCode);
        Assert.Equal("Privacy Policy", result.PolicyName);
        Assert.Equal(1, result.VersionNumber);
        Assert.Equal("Privacy Policy v1.0", result.Title);
        Assert.False(result.HasPreviousAccept);
        Assert.Null(result.PreviousAcceptVersion);
    }

    /// <summary>
    /// UTCID03: Normal case - Policy code does not exist or not active
    /// Expected: Throws KeyNotFoundException with policy code in message
    /// </summary>
    [Fact]
    public async Task UTCID03_GetActivePolicyContentAsync_InvalidPolicyCode_ThrowsKeyNotFoundException()
    {
        // Arrange
        string policyCode = "INVALID";

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync(policyCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetActivePolicyContentAsync(policyCode));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
        Assert.Contains("'INVALID'", exception.Message);
        Assert.Contains("đang active", exception.Message);

        // Verify repository call
        _mockPolicyRepository.Verify(r => r.GetActiveVersionByPolicyCodeAsync(policyCode, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID04: Abnormal case - policyCode: null
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_GetActivePolicyContentAsync_NullPolicyCode_ThrowsKeyNotFoundException()
    {
        // Arrange
        string policyCode = null!;

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetActivePolicyContentAsync(policyCode));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
    }

    /// <summary>
    /// UTCID05: Abnormal case - policyCode: "" (empty)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_GetActivePolicyContentAsync_EmptyPolicyCode_ThrowsKeyNotFoundException()
    {
        // Arrange
        string policyCode = "";

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync(policyCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetActivePolicyContentAsync(policyCode));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
        Assert.Contains("''", exception.Message); // Empty string in message
    }

    /// <summary>
    /// UTCID06: Abnormal case - policyCode: "   " (whitespace)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_GetActivePolicyContentAsync_WhitespacePolicyCode_ThrowsKeyNotFoundException()
    {
        // Arrange
        string policyCode = "   ";

        _mockPolicyRepository
            .Setup(r => r.GetActiveVersionByPolicyCodeAsync(policyCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.GetActivePolicyContentAsync(policyCode));

        Assert.Contains("Không tìm thấy chính sách", exception.Message);
    }
}
