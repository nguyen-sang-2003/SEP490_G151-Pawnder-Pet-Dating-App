using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        public UserRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<PagedResult<UserResponse>> GetUsersAsync(
            string? search,
            int? roleId,
            int? statusId,
            int page,
            int pageSize,
            bool includeDeleted,
            CancellationToken ct = default)
        {
            IQueryable<User> q = _dbSet.AsNoTracking().Include(u => u.Role);

            if (!includeDeleted)
                q = q.Where(u => u.IsDeleted == null || u.IsDeleted == false);

            // Exclude Admin users from the listing
            q = q.Where(u => u.Role == null || u.Role.RoleName != "Admin");

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                q = q.Where(u =>
                    EF.Functions.ILike(u.Email, $"%{s}%") ||
                    EF.Functions.ILike(u.FullName!, $"%{s}%"));
            }

            if (roleId.HasValue) q = q.Where(u => u.RoleId == roleId);
            if (statusId.HasValue) q = q.Where(u => u.UserStatusId == statusId);

            var total = await q.CountAsync(ct);

            var items = await q
                .OrderBy(u => u.UserId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserResponse
                {
                    UserId = u.UserId,
                    RoleId = u.RoleId,
                    UserStatusId = u.UserStatusId,
                    AddressId = u.AddressId,
                    FullName = u.FullName,
                    Gender = u.Gender,
                    Email = u.Email,
                    isProfileComplete = u.IsProfileComplete,
                    ProviderLogin = u.ProviderLogin,
                    IsDeleted = u.IsDeleted ?? false,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                })
                .ToListAsync(ct);

            return new PagedResult<UserResponse>(items, total, page, pageSize);
        }

        public async Task<User?> GetUserByIdAsync(int userId, bool includeDeleted = false, CancellationToken ct = default)
        {
            var query = _dbSet.AsNoTracking().Where(x => x.UserId == userId);
            
            if (!includeDeleted)
                query = query.Where(x => x.IsDeleted == null || x.IsDeleted == false);
            
            var user = await query.FirstOrDefaultAsync(ct);
            
            // Debug: Log IsProfileComplete directly from query result
            if (user != null)
            {
                Console.WriteLine($"[UserRepository.GetUserByIdAsync] UserId={userId}, IsProfileComplete from query: {user.IsProfileComplete}");
            }
            
            return user;
        }

        public async Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
        {
            return await _dbSet
                .AnyAsync(u => u.Email == email && (u.IsDeleted == null || u.IsDeleted == false), ct);
        }

        public async Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == email && (u.IsDeleted == null || u.IsDeleted == false), ct);
        }
    }
}

