using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IAuthService
    {
        Task<object> LoginAsync(LoginRequest request, CancellationToken ct = default);
        Task<object> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default);
        Task<bool> LogoutAsync(int userId, CancellationToken ct = default);
        Task<object> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default);
    }
}

