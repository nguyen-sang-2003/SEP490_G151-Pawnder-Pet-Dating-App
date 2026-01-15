using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.CreateVersionAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_CREATE_VERSION.txt
/// </summary>
public class CreateVersionAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public CreateVersionAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - policyId: 1 (exists), valid request
    /// Expected: Returns PolicyVersionResponse with Status = "DRAFT"
    /// </summary>
    [Fact]
    public async Task UTCID01_CreateVersionAsync_ValidPolicyValidData_ReturnsPolicyVersionResponse()
    {
        // Arrange
        int policyId = 1;
        int adminUserId = 1;
        var policy = new Policy { PolicyId = policyId, PolicyCode = "TERMS", PolicyName = "Terms" };
        var request = new CreatePolicyVersionRequest
        {
            Title = "Version Title",
            Content = "Version Content",
            ChangeLog = "Initial version"
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(policy);

        _mockPolicyRepository
            .Setup(r => r.GetNextVersionNumberAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _mockPolicyRepository
            .Setup(r => r.CreateVersionAsync(It.IsAny<PolicyVersion>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion v, CancellationToken ct) =>
            {
                v.PolicyVersionId = 1;
                return v;
            });

        // Act
        var result = await _service.CreateVersionAsync(policyId, request, adminUserId);

        // Assert
        Assert.NotNull(result);
        Assert.IsType<PolicyVersionResponse>(result);
        Assert.Equal(policyId, result.PolicyId);
        Assert.Equal("DRAFT", result.Status);
        Assert.Equal("Version Title", result.Title);
        Assert.Equal("Version Content", result.Content);
        Assert.Equal(1, result.VersionNumber);

        _mockPolicyRepository.Verify(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.CreateVersionAsync(It.IsAny<PolicyVersion>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - policyId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID02_CreateVersionAsync_NonExistentPolicy_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = 999;
        int adminUserId = 1;
        var request = new CreatePolicyVersionRequest
        {
            Title = "Title",
            Content = "Content"
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.CreateVersionAsync(policyId, request, adminUserId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);

        _mockPolicyRepository.Verify(r => r.CreateVersionAsync(It.IsAny<PolicyVersion>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Abnormal case - policyId: 0
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID03_CreateVersionAsync_PolicyIdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = 0;
        int adminUserId = 1;
        var request = new CreatePolicyVersionRequest
        {
            Title = "Title",
            Content = "Content"
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.CreateVersionAsync(policyId, request, adminUserId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID04: Abnormal case - policyId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_CreateVersionAsync_NegativePolicyId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = -1;
        int adminUserId = 1;
        var request = new CreatePolicyVersionRequest
        {
            Title = "Title",
            Content = "Content"
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.CreateVersionAsync(policyId, request, adminUserId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID05: Boundary case - policyId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_CreateVersionAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = int.MaxValue;
        int adminUserId = 1;
        var request = new CreatePolicyVersionRequest
        {
            Title = "Title",
            Content = "Content"
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.CreateVersionAsync(policyId, request, adminUserId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }

    /// <summary>
    /// UTCID06: Boundary case - policyId: int.MinValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_CreateVersionAsync_IntMinValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyId = int.MinValue;
        int adminUserId = 1;
        var request = new CreatePolicyVersionRequest
        {
            Title = "Title",
            Content = "Content"
        };

        _mockPolicyRepository
            .Setup(r => r.GetPolicyByIdAsync(policyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Policy?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.CreateVersionAsync(policyId, request, adminUserId));

        Assert.Contains("Không tìm thấy Policy", exception.Message);
    }
}

