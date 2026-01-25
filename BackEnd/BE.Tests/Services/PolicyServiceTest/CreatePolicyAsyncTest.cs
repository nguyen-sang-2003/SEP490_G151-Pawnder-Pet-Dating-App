using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.CreatePolicyAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_CREATE_POLICY.txt
/// </summary>
public class CreatePolicyAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public CreatePolicyAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - request.PolicyCode: "PRIVACY" (valid, not exists)
    /// Expected: Returns PolicyResponse, PolicyCode matches input (uppercase)
    /// </summary>
    [Fact]
    public async Task UTCID01_CreatePolicyAsync_ValidCodeNotExists_ReturnsPolicyResponse()
    {
        // Arrange
        var request = new CreatePolicyRequest
        {
            PolicyCode = "PRIVACY",
            PolicyName = "Privacy Policy",
            Description = "Privacy policy description",
            DisplayOrder = 1,
            RequireConsent = true
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByCodeAsync(request.PolicyCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        _mockPolicyRepository
            .Setup(r => r.CreatePolicyAsync(It.IsAny<Policy>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy p, CancellationToken ct) =>
            {
                p.PolicyId = 1;
                return p;
            });

        // Act
        var result = await _service.CreatePolicyAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyResponse>(result);
        Assert.Equal("PRIVACY", result.PolicyCode);
        Assert.True(result.IsActive);

        _mockPolicyRepository.Verify(r => r.GetPolicyByCodeAsync(request.PolicyCode, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CreatePolicyAsync(It.IsAny<Policy>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Abnormal case - request.PolicyCode: "EXISTING" (already exists)
    /// Expected: Throws InvalidOperationException with "Mã chính sách" và "đã tồn tại"
    /// </summary>
    [Fact]
    public async Task UTCID02_CreatePolicyAsync_CodeExists_ThrowsInvalidOperationException()
    {
        // Arrange
        var request = new CreatePolicyRequest
        {
            PolicyCode = "EXISTING",
            PolicyName = "Existing Policy"
        };

        var existingPolicy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "EXISTING",
            PolicyName = "Existing Policy"
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByCodeAsync(request.PolicyCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingPolicy);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.CreatePolicyAsync(request));

        Assert.Contains("Mã chính sách", exception.Message);
        Assert.Contains("đã tồn tại", exception.Message);

        _mockPolicyRepository.Verify(r => r.CreatePolicyAsync(It.IsAny<Policy>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}

