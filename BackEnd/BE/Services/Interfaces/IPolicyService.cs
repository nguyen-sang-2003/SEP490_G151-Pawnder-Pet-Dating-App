using BE.DTO;
using BE.Models;

namespace BE.Services.Interfaces;

public interface IPolicyService
{
    // Lấy danh sách tất cả Policy (Admin)
    Task<List<PolicyResponse>> GetAllPoliciesAsync(CancellationToken ct = default);

    // Lấy chi tiết Policy theo ID (Admin)
    Task<PolicyResponse> GetPolicyByIdAsync(int policyId, CancellationToken ct = default);

    // Tạo Policy mới (Admin)
    Task<PolicyResponse> CreatePolicyAsync(CreatePolicyRequest request, CancellationToken ct = default);

    // Cập nhật Policy (Admin)
    Task<PolicyResponse> UpdatePolicyAsync(int policyId, UpdatePolicyRequest request, CancellationToken ct = default);

    // Xóa Policy (soft delete) (Admin)
    Task<bool> DeletePolicyAsync(int policyId, CancellationToken ct = default);

    // Lấy danh sách Version của Policy (Admin)
    Task<List<PolicyVersionResponse>> GetVersionsByPolicyIdAsync(int policyId, CancellationToken ct = default);

    // Lấy chi tiết Version (Admin)
    Task<PolicyVersionResponse> GetVersionByIdAsync(int policyVersionId, CancellationToken ct = default);

    // Tạo Version mới (DRAFT) (Admin)
    Task<PolicyVersionResponse> CreateVersionAsync(int policyId, CreatePolicyVersionRequest request, int adminUserId, CancellationToken ct = default);

    // Cập nhật Version (chỉ DRAFT) (Admin)
    Task<PolicyVersionResponse> UpdateVersionAsync(int policyVersionId, UpdatePolicyVersionRequest request, CancellationToken ct = default);

    // Publish Version (DRAFT -> ACTIVE) (Admin)
    // Tự động deactivate version cũ và invalidate accept cũ
    Task<PolicyVersionResponse> PublishVersionAsync(int policyVersionId, CancellationToken ct = default);

    // Xóa Version (chỉ DRAFT) (Admin)
    Task<bool> DeleteVersionAsync(int policyVersionId, CancellationToken ct = default);

    // Lấy thống kê accept của các Policy (Admin)
    Task<List<PolicyAcceptStatsResponse>> GetAcceptStatsAsync(CancellationToken ct = default);

    // Kiểm tra trạng thái Policy của User
    // Trả về ACTIVE nếu đã accept đủ, PENDING_POLICY nếu chưa đủ
    Task<PolicyStatusResponse> CheckPolicyStatusAsync(int userId, CancellationToken ct = default);

    // Lấy danh sách Policy cần User xác nhận
    Task<List<PendingPolicyResponse>> GetPendingPoliciesAsync(int userId, CancellationToken ct = default);

    // User xác nhận một Policy
    Task<PolicyStatusResponse> AcceptPolicyAsync(int userId, AcceptPolicyRequest request, CancellationToken ct = default);

    // User xác nhận nhiều Policy cùng lúc
    Task<PolicyStatusResponse> AcceptMultiplePoliciesAsync(int userId, AcceptMultiplePoliciesRequest request, CancellationToken ct = default);

    // Lấy lịch sử accept của User
    Task<List<UserAcceptHistoryResponse>> GetUserAcceptHistoryAsync(int userId, CancellationToken ct = default);

    // Lấy nội dung Policy Active để User đọc
    Task<PendingPolicyResponse> GetActivePolicyContentAsync(string policyCode, CancellationToken ct = default);

    // Lấy tất cả Policy Active (cho User xem)
    Task<List<PendingPolicyResponse>> GetAllActivePoliciesAsync(CancellationToken ct = default);
}
