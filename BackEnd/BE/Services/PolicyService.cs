using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;

namespace BE.Services;

public class PolicyService : IPolicyService
{
    private readonly IPolicyRepository _policyRepository;

    public PolicyService(IPolicyRepository policyRepository)
    {
        _policyRepository = policyRepository;
    }

    public async Task<List<PolicyResponse>> GetAllPoliciesAsync(CancellationToken ct = default)
    {
        var policies = await _policyRepository.GetAllPoliciesAsync(ct);
        var result = new List<PolicyResponse>();

        foreach (var policy in policies)
        {
            var activeVersion = await _policyRepository.GetActiveVersionByPolicyIdAsync(policy.PolicyId, ct);
            var versions = await _policyRepository.GetVersionsByPolicyIdAsync(policy.PolicyId, ct);

            result.Add(MapToPolicyResponse(policy, activeVersion, versions.Count));
        }

        return result;
    }

    public async Task<PolicyResponse> GetPolicyByIdAsync(int policyId, CancellationToken ct = default)
    {
        var policy = await _policyRepository.GetPolicyByIdAsync(policyId, ct);
        if (policy == null)
            throw new KeyNotFoundException($"Không tìm thấy Policy với ID: {policyId}");

        var activeVersion = await _policyRepository.GetActiveVersionByPolicyIdAsync(policyId, ct);
        var versions = await _policyRepository.GetVersionsByPolicyIdAsync(policyId, ct);

        return MapToPolicyResponse(policy, activeVersion, versions.Count);
    }

    public async Task<PolicyResponse> CreatePolicyAsync(CreatePolicyRequest request, CancellationToken ct = default)
    {
        var existing = await _policyRepository.GetPolicyByCodeAsync(request.PolicyCode, ct);
        if (existing != null)
            throw new InvalidOperationException($"Mã chính sách '{request.PolicyCode}' đã tồn tại");

        var policy = new Policy
        {
            PolicyCode = request.PolicyCode.ToUpperInvariant(),
            PolicyName = request.PolicyName,
            Description = request.Description,
            DisplayOrder = request.DisplayOrder,
            RequireConsent = request.RequireConsent,
            IsActive = true,
            IsDeleted = false
        };

        await _policyRepository.CreatePolicyAsync(policy, ct);
        return MapToPolicyResponse(policy, null, 0);
    }

    public async Task<PolicyResponse> UpdatePolicyAsync(int policyId, UpdatePolicyRequest request, CancellationToken ct = default)
    {
        var policy = await _policyRepository.GetPolicyByIdAsync(policyId, ct);
        if (policy == null)
            throw new KeyNotFoundException($"Không tìm thấy Policy với ID: {policyId}");

        if (request.PolicyName != null)
            policy.PolicyName = request.PolicyName;
        if (request.Description != null)
            policy.Description = request.Description;
        if (request.DisplayOrder.HasValue)
            policy.DisplayOrder = request.DisplayOrder.Value;
        if (request.RequireConsent.HasValue)
            policy.RequireConsent = request.RequireConsent.Value;
        if (request.IsActive.HasValue)
            policy.IsActive = request.IsActive.Value;

        await _policyRepository.UpdatePolicyAsync(policy, ct);

        var activeVersion = await _policyRepository.GetActiveVersionByPolicyIdAsync(policyId, ct);
        var versions = await _policyRepository.GetVersionsByPolicyIdAsync(policyId, ct);

        return MapToPolicyResponse(policy, activeVersion, versions.Count);
    }

    public async Task<bool> DeletePolicyAsync(int policyId, CancellationToken ct = default)
    {
        return await _policyRepository.DeletePolicyAsync(policyId, ct);
    }

    public async Task<List<PolicyVersionResponse>> GetVersionsByPolicyIdAsync(int policyId, CancellationToken ct = default)
    {
        var policy = await _policyRepository.GetPolicyByIdAsync(policyId, ct);
        if (policy == null)
            throw new KeyNotFoundException($"Không tìm thấy Policy với ID: {policyId}");

        var versions = await _policyRepository.GetVersionsByPolicyIdAsync(policyId, ct);
        return versions.Select(v => MapToVersionResponse(v, policy.PolicyCode)).ToList();
    }

    public async Task<PolicyVersionResponse> GetVersionByIdAsync(int policyVersionId, CancellationToken ct = default)
    {
        var version = await _policyRepository.GetVersionByIdAsync(policyVersionId, ct);
        if (version == null)
            throw new KeyNotFoundException($"Không tìm thấy Version với ID: {policyVersionId}");

        return MapToVersionResponse(version, version.Policy.PolicyCode);
    }

    public async Task<PolicyVersionResponse> CreateVersionAsync(int policyId, CreatePolicyVersionRequest request, int adminUserId, CancellationToken ct = default)
    {
        var policy = await _policyRepository.GetPolicyByIdAsync(policyId, ct);
        if (policy == null)
            throw new KeyNotFoundException($"Không tìm thấy Policy với ID: {policyId}");

        var nextVersion = await _policyRepository.GetNextVersionNumberAsync(policyId, ct);

        var version = new PolicyVersion
        {
            PolicyId = policyId,
            VersionNumber = nextVersion,
            Title = request.Title,
            Content = request.Content,
            ChangeLog = request.ChangeLog,
            Status = "DRAFT",
            CreatedByUserId = adminUserId
        };

        await _policyRepository.CreateVersionAsync(version, ct);
        return MapToVersionResponse(version, policy.PolicyCode);
    }

    public async Task<PolicyVersionResponse> UpdateVersionAsync(int policyVersionId, UpdatePolicyVersionRequest request, CancellationToken ct = default)
    {
        var version = await _policyRepository.GetVersionByIdAsync(policyVersionId, ct);
        if (version == null)
            throw new KeyNotFoundException($"Không tìm thấy Version với ID: {policyVersionId}");

        if (version.Status != "DRAFT")
            throw new InvalidOperationException("Chỉ có thể chỉnh sửa Version ở trạng thái DRAFT");

        if (request.Title != null)
            version.Title = request.Title;
        if (request.Content != null)
            version.Content = request.Content;
        if (request.ChangeLog != null)
            version.ChangeLog = request.ChangeLog;

        await _policyRepository.UpdateVersionAsync(version, ct);
        return MapToVersionResponse(version, version.Policy.PolicyCode);
    }

    public async Task<PolicyVersionResponse> PublishVersionAsync(int policyVersionId, CancellationToken ct = default)
    {
        var version = await _policyRepository.GetVersionByIdAsync(policyVersionId, ct);
        if (version == null)
            throw new KeyNotFoundException($"Không tìm thấy Version với ID: {policyVersionId}");

        if (version.Status != "DRAFT")
            throw new InvalidOperationException("Chỉ có thể publish Version ở trạng thái DRAFT");

        var oldActiveVersion = await _policyRepository.GetActiveVersionByPolicyIdAsync(version.PolicyId, ct);
        if (oldActiveVersion != null)
        {
            oldActiveVersion.Status = "INACTIVE";
            oldActiveVersion.DeactivatedAt = DateTime.Now;
            await _policyRepository.UpdateVersionAsync(oldActiveVersion, ct);

            await _policyRepository.InvalidateAllAcceptsForVersionAsync(oldActiveVersion.PolicyVersionId, ct);
        }

        version.Status = "ACTIVE";
        version.PublishedAt = DateTime.Now;
        await _policyRepository.UpdateVersionAsync(version, ct);

        return MapToVersionResponse(version, version.Policy.PolicyCode);
    }

    public async Task<bool> DeleteVersionAsync(int policyVersionId, CancellationToken ct = default)
    {
        var version = await _policyRepository.GetVersionByIdAsync(policyVersionId, ct);
        if (version == null)
            throw new KeyNotFoundException($"Không tìm thấy Version với ID: {policyVersionId}");

        if (version.Status != "DRAFT")
            throw new InvalidOperationException("Chỉ có thể xóa Version ở trạng thái DRAFT");

        return await _policyRepository.DeleteVersionAsync(policyVersionId, ct);
    }

    public async Task<List<PolicyAcceptStatsResponse>> GetAcceptStatsAsync(CancellationToken ct = default)
    {
        var requiredPolicies = await _policyRepository.GetRequiredPoliciesAsync(ct);
        var totalActiveUsers = await _policyRepository.CountActiveUsersAsync(ct);
        var result = new List<PolicyAcceptStatsResponse>();

        foreach (var policy in requiredPolicies)
        {
            var activeVersion = await _policyRepository.GetActiveVersionByPolicyIdAsync(policy.PolicyId, ct);
            if (activeVersion == null) continue;

            var acceptedUsers = await _policyRepository.CountAcceptedUsersAsync(activeVersion.PolicyVersionId, ct);
            var pendingUsers = totalActiveUsers - acceptedUsers;
            var acceptRate = totalActiveUsers > 0 ? (double)acceptedUsers / totalActiveUsers * 100 : 0;

            result.Add(new PolicyAcceptStatsResponse
            {
                PolicyId = policy.PolicyId,
                PolicyCode = policy.PolicyCode,
                PolicyName = policy.PolicyName,
                ActiveVersionNumber = activeVersion.VersionNumber,
                TotalActiveUsers = totalActiveUsers,
                AcceptedUsers = acceptedUsers,
                PendingUsers = pendingUsers,
                AcceptRate = Math.Round(acceptRate, 2)
            });
        }

        return result;
    }

    public async Task<PolicyStatusResponse> CheckPolicyStatusAsync(int userId, CancellationToken ct = default)
    {
        var pendingPolicies = await GetPendingPoliciesAsync(userId, ct);

        if (pendingPolicies.Count == 0)
        {
            return new PolicyStatusResponse
            {
                IsCompliant = true,
                Status = "ACTIVE",
                Message = "Người dùng đã xác nhận đầy đủ các điều khoản",
                PendingPolicies = new List<PendingPolicyResponse>()
            };
        }

        return new PolicyStatusResponse
        {
            IsCompliant = false,
            Status = "PENDING_POLICY",
            Message = "Người dùng cần xác nhận điều khoản để tiếp tục sử dụng",
            PendingPolicies = pendingPolicies
        };
    }

    public async Task<List<PendingPolicyResponse>> GetPendingPoliciesAsync(int userId, CancellationToken ct = default)
    {
        var requiredVersions = await _policyRepository.GetActiveRequiredVersionsAsync(ct);

        var userAccepts = await _policyRepository.GetUserValidAcceptsAsync(userId, ct);
        var acceptedVersionIds = userAccepts.Select(a => a.PolicyVersionId).ToHashSet();

        var pendingPolicies = new List<PendingPolicyResponse>();

        foreach (var version in requiredVersions)
        {
            if (!acceptedVersionIds.Contains(version.PolicyVersionId))
            {
                var previousAccept = userAccepts
                    .FirstOrDefault(a => a.PolicyVersion.PolicyId == version.PolicyId && !a.IsValid);

                pendingPolicies.Add(new PendingPolicyResponse
                {
                    PolicyCode = version.Policy.PolicyCode,
                    PolicyName = version.Policy.PolicyName,
                    Description = version.Policy.Description,
                    DisplayOrder = version.Policy.DisplayOrder,
                    VersionNumber = version.VersionNumber,
                    Title = version.Title,
                    Content = version.Content,
                    ChangeLog = version.ChangeLog,
                    PublishedAt = version.PublishedAt,
                    HasPreviousAccept = previousAccept != null,
                    PreviousAcceptVersion = previousAccept?.PolicyVersion.VersionNumber
                });
            }
        }

        return pendingPolicies.OrderBy(p => p.DisplayOrder).ToList();
    }

    public async Task<PolicyStatusResponse> AcceptPolicyAsync(int userId, AcceptPolicyRequest request, CancellationToken ct = default)
    {
        var activeVersion = await _policyRepository.GetActiveVersionByPolicyCodeAsync(request.PolicyCode, ct);
        if (activeVersion == null)
            throw new KeyNotFoundException($"Không tìm thấy chính sách '{request.PolicyCode}' đang active");

        if (activeVersion.VersionNumber != request.VersionNumber)
            throw new InvalidOperationException($"Version không hợp lệ. Version hiện tại là {activeVersion.VersionNumber}");

        var alreadyAccepted = await _policyRepository.HasUserAcceptedVersionAsync(userId, activeVersion.PolicyVersionId, ct);
        if (alreadyAccepted)
            throw new InvalidOperationException("Bạn đã xác nhận chính sách này rồi");

        await _policyRepository.InvalidateOldAcceptsAsync(userId, activeVersion.PolicyId, ct);

        var accept = new UserPolicyAccept
        {
            UserId = userId,
            PolicyVersionId = activeVersion.PolicyVersionId,
            IsValid = true
        };

        await _policyRepository.CreateAcceptAsync(accept, ct);

        return await CheckPolicyStatusAsync(userId, ct);
    }

    public async Task<PolicyStatusResponse> AcceptMultiplePoliciesAsync(int userId, AcceptMultiplePoliciesRequest request, CancellationToken ct = default)
    {
        foreach (var policyRequest in request.Policies)
        {
            try
            {
                await AcceptPolicyAsync(userId, policyRequest, ct);
            }
            catch (InvalidOperationException)
            {
                // Bỏ qua nếu đã accept rồi
            }
        }

        return await CheckPolicyStatusAsync(userId, ct);
    }

    public async Task<List<UserAcceptHistoryResponse>> GetUserAcceptHistoryAsync(int userId, CancellationToken ct = default)
    {
        var accepts = await _policyRepository.GetUserAcceptHistoryAsync(userId, ct);

        return accepts.Select(a => new UserAcceptHistoryResponse
        {
            AcceptId = a.AcceptId,
            PolicyCode = a.PolicyVersion.Policy.PolicyCode,
            PolicyName = a.PolicyVersion.Policy.PolicyName,
            VersionNumber = a.PolicyVersion.VersionNumber,
            VersionTitle = a.PolicyVersion.Title,
            AcceptedAt = a.AcceptedAt,
            IsValid = a.IsValid,
            InvalidatedAt = a.InvalidatedAt
        }).ToList();
    }

    public async Task<PendingPolicyResponse> GetActivePolicyContentAsync(string policyCode, CancellationToken ct = default)
    {
        var activeVersion = await _policyRepository.GetActiveVersionByPolicyCodeAsync(policyCode, ct);
        if (activeVersion == null)
            throw new KeyNotFoundException($"Không tìm thấy chính sách '{policyCode}' đang active");

        return new PendingPolicyResponse
        {
            PolicyCode = activeVersion.Policy.PolicyCode,
            PolicyName = activeVersion.Policy.PolicyName,
            Description = activeVersion.Policy.Description,
            DisplayOrder = activeVersion.Policy.DisplayOrder,
            VersionNumber = activeVersion.VersionNumber,
            Title = activeVersion.Title,
            Content = activeVersion.Content,
            ChangeLog = activeVersion.ChangeLog,
            PublishedAt = activeVersion.PublishedAt,
            HasPreviousAccept = false,
            PreviousAcceptVersion = null
        };
    }

    public async Task<List<PendingPolicyResponse>> GetAllActivePoliciesAsync(CancellationToken ct = default)
    {
        var activeVersions = await _policyRepository.GetActiveRequiredVersionsAsync(ct);

        return activeVersions.Select(v => new PendingPolicyResponse
        {
            PolicyCode = v.Policy.PolicyCode,
            PolicyName = v.Policy.PolicyName,
            Description = v.Policy.Description,
            DisplayOrder = v.Policy.DisplayOrder,
            VersionNumber = v.VersionNumber,
            Title = v.Title,
            Content = v.Content,
            ChangeLog = v.ChangeLog,
            PublishedAt = v.PublishedAt,
            HasPreviousAccept = false,
            PreviousAcceptVersion = null
        }).OrderBy(p => p.DisplayOrder).ToList();
    }

    private PolicyResponse MapToPolicyResponse(Policy policy, PolicyVersion? activeVersion, int totalVersions)
    {
        return new PolicyResponse
        {
            PolicyId = policy.PolicyId,
            PolicyCode = policy.PolicyCode,
            PolicyName = policy.PolicyName,
            Description = policy.Description,
            DisplayOrder = policy.DisplayOrder,
            RequireConsent = policy.RequireConsent,
            IsActive = policy.IsActive,
            CreatedAt = policy.CreatedAt,
            UpdatedAt = policy.UpdatedAt,
            TotalVersions = totalVersions,
            ActiveVersion = activeVersion != null ? MapToVersionResponse(activeVersion, policy.PolicyCode) : null
        };
    }

    private PolicyVersionResponse MapToVersionResponse(PolicyVersion version, string policyCode)
    {
        return new PolicyVersionResponse
        {
            PolicyVersionId = version.PolicyVersionId,
            PolicyId = version.PolicyId,
            PolicyCode = policyCode,
            VersionNumber = version.VersionNumber,
            Title = version.Title,
            Content = version.Content,
            ChangeLog = version.ChangeLog,
            Status = version.Status,
            PublishedAt = version.PublishedAt,
            DeactivatedAt = version.DeactivatedAt,
            CreatedByUserId = version.CreatedByUserId,
            CreatedByUserName = version.CreatedByUser?.FullName,
            CreatedAt = version.CreatedAt,
            UpdatedAt = version.UpdatedAt
        };
    }
}
