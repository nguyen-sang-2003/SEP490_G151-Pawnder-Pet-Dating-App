using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IUserPreferenceRepository : IBaseRepository<UserPreference>
    {
        Task<IEnumerable<UserPreferenceResponse>> GetUserPreferencesAsync(int userId, CancellationToken ct = default);
        Task<UserPreference?> GetUserPreferenceAsync(int userId, int attributeId, CancellationToken ct = default);
        Task<bool> ExistsAsync(int userId, int attributeId, CancellationToken ct = default);
        Task<IEnumerable<UserPreference>> GetUserPreferencesByUserIdAsync(int userId, CancellationToken ct = default);
    }
}




