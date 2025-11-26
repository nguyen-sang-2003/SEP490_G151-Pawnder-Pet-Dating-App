using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IAdminService
    {
        Task<object> ReassignExpertConfirmationAsync(ReassignExpertConfirmationRequest req, CancellationToken ct = default);
        Task<object> BanUserAsync(int userId, BanUserRequest req, CancellationToken ct = default);
        Task<object> UnbanUserAsync(int userId, UnbanUserRequest? req, CancellationToken ct = default);
        Task<IEnumerable<object>> GetUserBansAsync(int userId, CancellationToken ct = default);
        Task<bool> UpdateUserByAdminAsync(int userId, AdUserUpdateRequest request, CancellationToken ct = default);
        Task<UserResponse> RegisterUserByAdminAsync(AdUserCreateRequest req, CancellationToken ct = default);
    }
}




