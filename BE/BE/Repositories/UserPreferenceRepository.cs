using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class UserPreferenceRepository : BaseRepository<UserPreference>, IUserPreferenceRepository
    {
        public UserPreferenceRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<UserPreferenceResponse>> GetUserPreferencesAsync(int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .AsNoTracking()
                .Where(up => up.UserId == userId)
                .Include(up => up.Attribute)
                .Include(up => up.Option)
                .OrderBy(up => up.AttributeId)
                .Select(up => new UserPreferenceResponse
                {
                    AttributeId = up.AttributeId,
                    AttributeName = up.Attribute.Name!,
                    TypeValue = up.Attribute.TypeValue,
                    Unit = up.Attribute.Unit,
                    OptionId = up.OptionId,
                    OptionName = up.Option != null ? up.Option.Name : null,
                    MaxValue = up.MaxValue,
                    MinValue = up.MinValue,
                    CreatedAt = up.CreatedAt,
                    UpdatedAt = up.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<UserPreference?> GetUserPreferenceAsync(int userId, int attributeId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(up => up.Attribute)
                .FirstOrDefaultAsync(up => up.UserId == userId && up.AttributeId == attributeId, ct);
        }

        public async Task<bool> ExistsAsync(int userId, int attributeId, CancellationToken ct = default)
        {
            return await _dbSet
                .AnyAsync(up => up.UserId == userId && up.AttributeId == attributeId, ct);
        }

        public async Task<IEnumerable<UserPreference>> GetUserPreferencesByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(p => p.UserId == userId)
                .ToListAsync(ct);
        }
    }
}




