using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.PolicyServiceTest;

/// <summary>
/// Unit Tests cho PolicyService.DeleteVersionAsync
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_DELETE_VERSION.txt
/// </summary>
public class DeleteVersionAsyncTest
{
    private readonly Mock<IPolicyRepository> _mockPolicyRepository;
    private readonly PolicyService _service;

    public DeleteVersionAsyncTest()
    {
        _mockPolicyRepository = new Mock<IPolicyRepository>();
        _service = new PolicyService(_mockPolicyRepository.Object);
    }

    /// <summary>
    /// UTCID01: Normal case - policyVersionId: 1 (exists, DRAFT status)
    /// Expected: Returns true, version deleted successfully
    /// </summary>
    [Fact]
    public async Task UTCID01_DeleteVersionAsync_DraftVersion_ReturnsTrue()
    {
        // Arrange
        int policyVersionId = 1;
        var policy = new Policy
        {
            PolicyId = 1,
            PolicyCode = "TERMS",
            PolicyName = "Terms of Service"
        };

        var draftVersion = new PolicyVersion
        {
            PolicyVersionId = policyVersionId,
            PolicyId = 1,
            VersionNumber = 1,
            Title = "Draft Version",
            Content = "Draft content",
            Status = "DRAFT",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(draftVersion);

        _mockPolicyRepository
            .Setup(r => r.DeleteVersionAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _service.DeleteVersionAsync(policyVersionId);

        // Assert
        Assert.True(result);

        // Verify method calls
        _mockPolicyRepository.Verify(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()), Times.Once);
        _mockPolicyRepository.Verify(r => r.DeleteVersionAsync(policyVersionId, It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>
    /// UTCID02: Normal case - policyVersionId: 2 (exists but ACTIVE status)
    /// Expected: Throws InvalidOperationException with message about DRAFT status
    /// </summary>
    [Fact]
    public async Task UTCID02_DeleteVersionAsync_ActiveVersion_ThrowsInvalidOperationException()
    {
        // Arrange
        int policyVersionId = 2;
        var policy = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var activeVersion = new PolicyVersion
        {
            PolicyVersionId = policyVersionId,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "ACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeVersion);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.DeleteVersionAsync(policyVersionId));

        Assert.Contains("Chỉ có thể xóa Version ở trạng thái DRAFT", exception.Message);

        // Verify delete was not called
        _mockPolicyRepository.Verify(r => r.DeleteVersionAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID03: Normal case - policyVersionId: 3 (exists but INACTIVE status)
    /// Expected: Throws InvalidOperationException with message about DRAFT status
    /// </summary>
    [Fact]
    public async Task UTCID03_DeleteVersionAsync_InactiveVersion_ThrowsInvalidOperationException()
    {
        // Arrange
        int policyVersionId = 3;
        var policy = new Policy { PolicyId = 1, PolicyCode = "TERMS", PolicyName = "Terms" };
        var inactiveVersion = new PolicyVersion
        {
            PolicyVersionId = policyVersionId,
            PolicyId = 1,
            VersionNumber = 1,
            Status = "INACTIVE",
            Policy = policy
        };

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(inactiveVersion);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.DeleteVersionAsync(policyVersionId));

        Assert.Contains("Chỉ có thể xóa Version ở trạng thái DRAFT", exception.Message);

        // Verify delete was not called
        _mockPolicyRepository.Verify(r => r.DeleteVersionAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID04: Normal case - policyVersionId: 999 (not exists)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID04_DeleteVersionAsync_NonExistentVersion_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = 999;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteVersionAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
        Assert.Contains(policyVersionId.ToString(), exception.Message);

        // Verify delete was not called
        _mockPolicyRepository.Verify(r => r.DeleteVersionAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    /// <summary>
    /// UTCID05: Abnormal case - policyVersionId: 0
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID05_DeleteVersionAsync_ZeroVersionId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = 0;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteVersionAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID06: Abnormal case - policyVersionId: -1 (negative)
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID06_DeleteVersionAsync_NegativeVersionId_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = -1;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteVersionAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID07: Boundary case - policyVersionId: int.MaxValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID07_DeleteVersionAsync_IntMaxValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = int.MaxValue;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteVersionAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }

    /// <summary>
    /// UTCID08: Boundary case - policyVersionId: int.MinValue
    /// Expected: Throws KeyNotFoundException
    /// </summary>
    [Fact]
    public async Task UTCID08_DeleteVersionAsync_IntMinValue_ThrowsKeyNotFoundException()
    {
        // Arrange
        int policyVersionId = int.MinValue;

        _mockPolicyRepository
            .Setup(r => r.GetVersionByIdAsync(policyVersionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyVersion?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _service.DeleteVersionAsync(policyVersionId));

        Assert.Contains("Không tìm thấy Version", exception.Message);
    }
}
