using BE.Models;

namespace BE.Repositories.Interfaces;

public interface IPolicyRepository
{
    // Lấy tất cả Policy (không bao gồm đã xóa)
    Task<List<Policy>> GetAllPoliciesAsync(CancellationToken ct = default);

    // Lấy Policy theo ID
    Task<Policy?> GetPolicyByIdAsync(int policyId, CancellationToken ct = default);

    // Lấy Policy theo Code
    Task<Policy?> GetPolicyByCodeAsync(string policyCode, CancellationToken ct = default);

    // Tạo Policy mới
    Task<Policy> CreatePolicyAsync(Policy policy, CancellationToken ct = default);

    // Cập nhật Policy
    Task<Policy> UpdatePolicyAsync(Policy policy, CancellationToken ct = default);

    // Soft delete Policy
    Task<bool> DeletePolicyAsync(int policyId, CancellationToken ct = default);

    // Lấy tất cả Version của một Policy
    Task<List<PolicyVersion>> GetVersionsByPolicyIdAsync(int policyId, CancellationToken ct = default);

    // Lấy PolicyVersion theo ID
    Task<PolicyVersion?> GetVersionByIdAsync(int policyVersionId, CancellationToken ct = default);

    // Lấy Version Active của Policy
    Task<PolicyVersion?> GetActiveVersionByPolicyIdAsync(int policyId, CancellationToken ct = default);

    // Lấy Version Active của Policy theo Code
    Task<PolicyVersion?> GetActiveVersionByPolicyCodeAsync(string policyCode, CancellationToken ct = default);

    // Lấy version number tiếp theo cho Policy
    Task<int> GetNextVersionNumberAsync(int policyId, CancellationToken ct = default);

    // Tạo PolicyVersion mới
    Task<PolicyVersion> CreateVersionAsync(PolicyVersion version, CancellationToken ct = default);

    // Cập nhật PolicyVersion
    Task<PolicyVersion> UpdateVersionAsync(PolicyVersion version, CancellationToken ct = default);

    // Xóa PolicyVersion (chỉ cho phép xóa DRAFT)
    Task<bool> DeleteVersionAsync(int policyVersionId, CancellationToken ct = default);

    // Lấy tất cả Policy đang Active và RequireConsent
    Task<List<Policy>> GetRequiredPoliciesAsync(CancellationToken ct = default);

    // Lấy tất cả version Active của các Policy RequireConsent
    Task<List<PolicyVersion>> GetActiveRequiredVersionsAsync(CancellationToken ct = default);

    // Kiểm tra user đã accept version cụ thể chưa
    Task<bool> HasUserAcceptedVersionAsync(int userId, int policyVersionId, CancellationToken ct = default);

    // Lấy danh sách PolicyVersion mà user đã accept (valid)
    Task<List<UserPolicyAccept>> GetUserValidAcceptsAsync(int userId, CancellationToken ct = default);

    // Lấy accept history của user
    Task<List<UserPolicyAccept>> GetUserAcceptHistoryAsync(int userId, CancellationToken ct = default);

    // Tạo accept mới
    Task<UserPolicyAccept> CreateAcceptAsync(UserPolicyAccept accept, CancellationToken ct = default);

    // Vô hiệu hóa các accept cũ của user cho policy khi có version mới
    Task InvalidateOldAcceptsAsync(int userId, int policyId, CancellationToken ct = default);

    // Vô hiệu hóa tất cả accept của một policy version (khi publish version mới)
    Task InvalidateAllAcceptsForVersionAsync(int policyVersionId, CancellationToken ct = default);

    // Đếm số user đã accept version cụ thể
    Task<int> CountAcceptedUsersAsync(int policyVersionId, CancellationToken ct = default);

    // Đếm tổng số user active
    Task<int> CountActiveUsersAsync(CancellationToken ct = default);
}
