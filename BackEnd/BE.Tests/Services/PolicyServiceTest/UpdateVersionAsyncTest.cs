using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.UpdateVersionAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_UPDATE_VERSION.txt
/// </summary>
public class UpdateVersionAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public UpdateVersionAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - policyVersionId: 1 (exists), Status: "DRAFT", valid request
    /// Expected: Returns PolicyVersionResponse with updated values
    /// </summary>
    [Fact]
    public async Task UTCID01_UpdateVersionAsync_ValidIdDraftStatus_ReturnsPolicyVersionResponse()
    {
        // Arrange
        int policyVersionId = 1;
        var policy = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var existingVersion = new PolicyVersion
        {
            PolicyVersionId = policyVersionId,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Old Title",
            Content = "Old Content",
            Status = "DRAFT",
            Policy = policy
        };

        var request = new UpdatePolicyVersionRequest
        {
            Title = "Updated Title",
            Content = "Updated Content",
            ChangeLog = "Updated Changes"
        };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingVersion);

        _mockPolicyRepository
            .Setup(r => r.UpdateVersionAsync(It.IsAny<PolicyVersion>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion v, CancellationToken ct) => v);

        // Act
        var result = await _service.UpdateVersionAsync(policyVersionId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(policyVersionId, result.PolicyVersionId);
        Assert.Equal("Updated Title", result.Title);
        Assert.Equal("Updated Content", result.Content);
        Assert.Equal("Updated Changes", result.ChangeLog);

        _mockPolicyRepository.Verify(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.UpdateVersionAsync(It.IsAny<PolicyVersion>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - policyVersionId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID02_UpdateVersionAsync_NonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = 999;
        var request = new UpdatePolicyVersionRequest { Title = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdateVersionAsync(policyVersionId, request));

        Assert.Contains("Không tìm thấy Version", exception.Message);

        _mockPolicyRepository.Verify(r => r.UpdateVersionAsync(It.IsAny<PolicyVersion>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Abnormal case - policyVersionId: 1 (exists), Status: "ACTIVE"
    /// Expected: Throws InvalidOperationException
    /// </summary>
    [Fact]
    public async Task UTCID03_UpdateVersionAsync_ActiveStatus_ThrowsInvalidOperationException()
    {
        // Arrange
        int policyVersionId = 1;
        var policy = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var existingVersion = new PolicyVersion
        {
            PolicyVersionId = policyVersionId,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Title",
            Content = "Content",
            Status = "ACTIVE", // Not DRAFT
            Policy = policy
        };

        var request = new UpdatePolicyVersionRequest { Title = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingVersion);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.UpdateVersionAsync(policyVersionId, request));

        Assert.Contains("Chỉ có thể chỉnh sửa Version ở trạng thái DRAFT", exception.Message);

        _mockPolicyRepository.Verify(r => r.UpdateVersionAsync(It.IsAny<PolicyVersion>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID04: Abnormal case - policyVersionId: 1 (exists), Status: "INACTIVE"
    /// Expected: Throws InvalidOperationException
    /// </summary>
    [Fact]
    public async Task UTCID04_UpdateVersionAsync_InactiveStatus_ThrowsInvalidOperationException()
    {
        // Arrange
        int policyVersionId = 1;
        var policy = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var existingVersion = new PolicyVersion
        {
            PolicyVersionId = policyVersionId,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Title",
            Content = "Content",
            Status = "INACTIVE", // Not DRAFT
            Policy = policy
        };

        var request = new UpdatePolicyVersionRequest { Title = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingVersion);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.UpdateVersionAsync(policyVersionId, request));

        Assert.Contains("Chỉ có thể chỉnh sửa Version ở trạng thái DRAFT", exception.Message);

        _mockPolicyRepository.Verify(r => r.UpdateVersionAsync(It.IsAny<PolicyVersion>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID05: Abnormal case - policyVersionId: 0
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_UpdateVersionAsync_IdZero_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = 0;
        var request = new UpdatePolicyVersionRequest { Title = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdateVersionAsync(policyVersionId, request));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID06: Abnormal case - policyVersionId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_UpdateVersionAsync_NegativeId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = -1;
        var request = new UpdatePolicyVersionRequest { Title = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdateVersionAsync(policyVersionId, request));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID07: Boundary case - policyVersionId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID07_UpdateVersionAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = int.MaxValue;
        var request = new UpdatePolicyVersionRequest { Title = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdateVersionAsync(policyVersionId, request));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID08: Boundary case - policyVersionId: int.MinValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID08_UpdateVersionAsync_IntMinValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = int.MinValue;
        var request = new UpdatePolicyVersionRequest { Title = "Test" };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.UpdateVersionAsync(policyVersionId, request));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }
}

