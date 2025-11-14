using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IUserService
    {
        Task<PagedResult<UserResponse>> GetUsersAsync(
            string? search,
            int? roleId,
            int? statusId,
            int page,
            int pageSize,
            bool includeDeleted,
            CancellationToken ct = default);
        
        Task<UserResponse?> GetUserByIdAsync(int userId, CancellationToken ct = default);
        Task<UserResponse> RegisterAsync(UserCreateRequest req, CancellationToken ct = default);
        Task<UserResponse> UpdateUserAsync(int userId, UserUpdateRequest req, CancellationToken ct = default);
        Task<bool> SoftDeleteUserAsync(int userId, CancellationToken ct = default);
        Task<bool> CompleteProfileAsync(int id, CancellationToken ct = default);
        Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
    }
}




