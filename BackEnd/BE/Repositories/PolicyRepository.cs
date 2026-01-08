using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories;

public class PolicyRepository : IPolicyRepository
{
    private readonly PawnderDatabaseContext _context;

    public PolicyRepository(PawnderDatabaseContext context)
    {
        _context = context;
    }

    public async Task<List<Policy>> GetAllPoliciesAsync(CancellationToken ct = default)
    {
        return await _context.Policies
            .Where(p => !p.IsDeleted)
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.PolicyCode)
            .ToListAsync(ct);
    }

    public async Task<Policy?> GetPolicyByIdAsync(int policyId, CancellationToken ct = default)
    {
        return await _context.Policies
            .Include(p => p.PolicyVersions.Where(v => v.Status == "ACTIVE"))
            .FirstOrDefaultAsync(p => p.PolicyId == policyId && !p.IsDeleted, ct);
    }

    public async Task<Policy?> GetPolicyByCodeAsync(string policyCode, CancellationToken ct = default)
    {
        return await _context.Policies
            .Include(p => p.PolicyVersions.Where(v => v.Status == "ACTIVE"))
            .FirstOrDefaultAsync(p => p.PolicyCode == policyCode && !p.IsDeleted, ct);
    }

    public async Task<Policy> CreatePolicyAsync(Policy policy, CancellationToken ct = default)
    {
        policy.CreatedAt = DateTime.Now;
        policy.UpdatedAt = DateTime.Now;
        _context.Policies.Add(policy);
        await _context.SaveChangesAsync(ct);
        return policy;
    }

    public async Task<Policy> UpdatePolicyAsync(Policy policy, CancellationToken ct = default)
    {
        policy.UpdatedAt = DateTime.Now;
        _context.Policies.Update(policy);
        await _context.SaveChangesAsync(ct);
        return policy;
    }

    public async Task<bool> DeletePolicyAsync(int policyId, CancellationToken ct = default)
    {
        var policy = await _context.Policies.FindAsync(new object[] { policyId }, ct);
        if (policy == null) return false;

        policy.IsDeleted = true;
        policy.IsActive = false;
        policy.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<PolicyVersion>> GetVersionsByPolicyIdAsync(int policyId, CancellationToken ct = default)
    {
        return await _context.PolicyVersions
            .Include(v => v.CreatedByUser)
            .Where(v => v.PolicyId == policyId)
            .OrderByDescending(v => v.VersionNumber)
            .ToListAsync(ct);
    }

    public async Task<PolicyVersion?> GetVersionByIdAsync(int policyVersionId, CancellationToken ct = default)
    {
        return await _context.PolicyVersions
            .Include(v => v.Policy)
            .Include(v => v.CreatedByUser)
            .FirstOrDefaultAsync(v => v.PolicyVersionId == policyVersionId, ct);
    }

    public async Task<PolicyVersion?> GetActiveVersionByPolicyIdAsync(int policyId, CancellationToken ct = default)
    {
        return await _context.PolicyVersions
            .Include(v => v.Policy)
            .FirstOrDefaultAsync(v => v.PolicyId == policyId && v.Status == "ACTIVE", ct);
    }

    public async Task<PolicyVersion?> GetActiveVersionByPolicyCodeAsync(string policyCode, CancellationToken ct = default)
    {
        return await _context.PolicyVersions
            .Include(v => v.Policy)
            .FirstOrDefaultAsync(v => v.Policy.PolicyCode == policyCode && v.Status == "ACTIVE" && !v.Policy.IsDeleted, ct);
    }

    public async Task<int> GetNextVersionNumberAsync(int policyId, CancellationToken ct = default)
    {
        var maxVersion = await _context.PolicyVersions
            .Where(v => v.PolicyId == policyId)
            .MaxAsync(v => (int?)v.VersionNumber, ct);
        
        return (maxVersion ?? 0) + 1;
    }

    public async Task<PolicyVersion> CreateVersionAsync(PolicyVersion version, CancellationToken ct = default)
    {
        version.CreatedAt = DateTime.Now;
        version.UpdatedAt = DateTime.Now;
        _context.PolicyVersions.Add(version);
        await _context.SaveChangesAsync(ct);
        return version;
    }

    public async Task<PolicyVersion> UpdateVersionAsync(PolicyVersion version, CancellationToken ct = default)
    {
        version.UpdatedAt = DateTime.Now;
        _context.PolicyVersions.Update(version);
        await _context.SaveChangesAsync(ct);
        return version;
    }

    public async Task<bool> DeleteVersionAsync(int policyVersionId, CancellationToken ct = default)
    {
        var version = await _context.PolicyVersions.FindAsync(new object[] { policyVersionId }, ct);
        if (version == null || version.Status != "DRAFT") return false;

        _context.PolicyVersions.Remove(version);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<Policy>> GetRequiredPoliciesAsync(CancellationToken ct = default)
    {
        return await _context.Policies
            .Include(p => p.PolicyVersions.Where(v => v.Status == "ACTIVE"))
            .Where(p => p.IsActive && p.RequireConsent && !p.IsDeleted)
            .OrderBy(p => p.DisplayOrder)
            .ToListAsync(ct);
    }

    public async Task<List<PolicyVersion>> GetActiveRequiredVersionsAsync(CancellationToken ct = default)
    {
        return await _context.PolicyVersions
            .Include(v => v.Policy)
            .Where(v => v.Status == "ACTIVE" 
                && v.Policy.IsActive 
                && v.Policy.RequireConsent 
                && !v.Policy.IsDeleted)
            .OrderBy(v => v.Policy.DisplayOrder)
            .ToListAsync(ct);
    }

    public async Task<bool> HasUserAcceptedVersionAsync(int userId, int policyVersionId, CancellationToken ct = default)
    {
        return await _context.UserPolicyAccepts
            .AnyAsync(a => a.UserId == userId 
                && a.PolicyVersionId == policyVersionId 
                && a.IsValid, ct);
    }

    public async Task<List<UserPolicyAccept>> GetUserValidAcceptsAsync(int userId, CancellationToken ct = default)
    {
        return await _context.UserPolicyAccepts
            .Include(a => a.PolicyVersion)
                .ThenInclude(v => v.Policy)
            .Where(a => a.UserId == userId && a.IsValid)
            .ToListAsync(ct);
    }

    public async Task<List<UserPolicyAccept>> GetUserAcceptHistoryAsync(int userId, CancellationToken ct = default)
    {
        return await _context.UserPolicyAccepts
            .Include(a => a.PolicyVersion)
                .ThenInclude(v => v.Policy)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AcceptedAt)
            .ToListAsync(ct);
    }

    public async Task<UserPolicyAccept> CreateAcceptAsync(UserPolicyAccept accept, CancellationToken ct = default)
    {
        accept.CreatedAt = DateTime.Now;
        accept.AcceptedAt = DateTime.Now;
        _context.UserPolicyAccepts.Add(accept);
        await _context.SaveChangesAsync(ct);
        return accept;
    }

    public async Task InvalidateOldAcceptsAsync(int userId, int policyId, CancellationToken ct = default)
    {
        var oldAccepts = await _context.UserPolicyAccepts
            .Include(a => a.PolicyVersion)
            .Where(a => a.UserId == userId 
                && a.PolicyVersion.PolicyId == policyId 
                && a.IsValid)
            .ToListAsync(ct);

        foreach (var accept in oldAccepts)
        {
            accept.IsValid = false;
            accept.InvalidatedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task InvalidateAllAcceptsForVersionAsync(int policyVersionId, CancellationToken ct = default)
    {
        var accepts = await _context.UserPolicyAccepts
            .Where(a => a.PolicyVersionId == policyVersionId && a.IsValid)
            .ToListAsync(ct);

        foreach (var accept in accepts)
        {
            accept.IsValid = false;
            accept.InvalidatedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync(ct);
    }

    public async Task<int> CountAcceptedUsersAsync(int policyVersionId, CancellationToken ct = default)
    {
        // Chỉ đếm user có RoleId = 3 (User - người dùng thường) đã accept policy
        return await _context.UserPolicyAccepts
            .Where(a => a.PolicyVersionId == policyVersionId && a.IsValid)
            .Join(_context.Users, 
                accept => accept.UserId,
                user => user.UserId,
                (accept, user) => user)
            .Where(u => u.RoleId == 3 && u.IsDeleted != true)
            .Select(u => u.UserId)
            .Distinct()
            .CountAsync(ct);
    }

    public async Task<int> CountActiveUsersAsync(CancellationToken ct = default)
    {
        // Chỉ đếm user có RoleId = 3 (User - người dùng thường) và đang hoạt động (không bị xóa)
        // Admin và Expert không tính vào policy acceptance rate
        return await _context.Users
            .Where(u => u.IsDeleted != true && u.RoleId == 3)
            .CountAsync(ct);
    }
}
