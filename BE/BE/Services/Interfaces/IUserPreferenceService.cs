using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IUserPreferenceService
    {
        Task<IEnumerable<UserPreferenceResponse>> GetUserPreferencesAsync(int userId, CancellationToken ct = default);
        Task<object> CreateUserPreferenceAsync(int userId, int attributeId, UserPreferenceUpsertRequest req, CancellationToken ct = default);
        Task<UserPreferenceResponse> UpdateUserPreferenceAsync(int userId, int attributeId, UserPreferenceUpsertRequest req, CancellationToken ct = default);
        Task<bool> DeleteUserPreferencesAsync(int userId, CancellationToken ct = default);
        Task<object> UpsertBatchAsync(int userId, UserPreferenceBatchUpsertRequest request, CancellationToken ct = default);
    }
}




