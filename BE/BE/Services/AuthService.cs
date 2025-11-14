using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BE.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PasswordService _passwordService;
        private readonly TokenService _tokenService;

        public AuthService(
            IUserRepository userRepository,
            PawnderDatabaseContext context,
            PasswordService passwordService,
            TokenService tokenService)
        {
            _userRepository = userRepository;
            _context = context;
            _passwordService = passwordService;
            _tokenService = tokenService;
        }

        public async Task<object> LoginAsync(LoginRequest request, CancellationToken ct = default)
        {
            var email = request.Email?.Trim();
            var password = request.Password?.Trim();

            // Business logic: Get user with role
            var user = await _userRepository.GetUserByEmailAsync(email!, ct);
            if (user == null)
                throw new UnauthorizedAccessException("Tài khoản không tồn tại");

            // Business logic: Verify password
            bool isPasswordValid = _passwordService.VerifyPassword(password!, user.PasswordHash);
            if (!isPasswordValid)
                throw new UnauthorizedAccessException("Sai mật khẩu");

            // Business logic: Auto-upgrade legacy SHA256 passwords to BCrypt
            if (_passwordService.IsLegacyHash(user.PasswordHash))
            {
                user.PasswordHash = _passwordService.HashPassword(password!);
                await _userRepository.UpdateAsync(user, ct);
            }

            // Business logic: Check ban status
            var now = DateTime.Now;
            var activeBan = await _context.UserBanHistories
                .AsNoTracking()
                .Where(b => b.UserId == user.UserId && b.IsActive == true)
                .OrderByDescending(b => b.BanStart)
                .FirstOrDefaultAsync(ct);

            if (activeBan != null)
            {
                var stillBanned = !activeBan.BanEnd.HasValue || activeBan.BanEnd.Value > now;
                if (stillBanned)
                {
                    var message = activeBan.BanEnd.HasValue
                        ? "Tài khoản đang bị khóa tạm thời"
                        : "Tài khoản đã bị khóa vĩnh viễn";
                    throw new InvalidOperationException($"{message}. BanStart: {activeBan.BanStart}, BanEnd: {activeBan.BanEnd}, Reason: {activeBan.BanReason}");
                }
                else
                {
                    // Business logic: Auto-deactivate expired ban
                    var banToDeactivate = await _context.UserBanHistories
                        .FirstOrDefaultAsync(b => b.BanId == activeBan.BanId, ct);
                    if (banToDeactivate != null && banToDeactivate.IsActive == true)
                    {
                        banToDeactivate.IsActive = false;
                        banToDeactivate.UpdatedAt = now;

                        // Business logic: Set user status based on payment history
                        var hasPaymentHistory = await _context.PaymentHistories
                            .AsNoTracking()
                            .AnyAsync(ph => ph.UserId == user.UserId, ct);
                        var targetStatusName = hasPaymentHistory ? "Tài khoản VIP" : "Tài khoản thường";
                        var targetStatus = await _context.UserStatuses
                            .AsNoTracking()
                            .FirstOrDefaultAsync(s => EF.Functions.ILike(s.UserStatusName, targetStatusName), ct);
                        if (targetStatus != null)
                        {
                            user.UserStatusId = targetStatus.UserStatusId;
                            user.UpdatedAt = now;
                        }
                        await _context.SaveChangesAsync(ct);
                    }
                }
            }

            // Business logic: Generate tokens
            var accessToken = _tokenService.GenerateAccessToken(user.UserId, user.Role?.RoleName ?? "User");

            string refreshToken;
            if (!string.IsNullOrEmpty(user.TokenJwt))
            {
                // Business logic: Validate existing refresh token
                var principal = _tokenService.GetPrincipalFromToken(user.TokenJwt, validateLifetime: true);
                if (principal != null)
                {
                    refreshToken = user.TokenJwt; // Keep existing token
                }
                else
                {
                    // Business logic: Generate new refresh token
                    refreshToken = _tokenService.GenerateRefreshToken(user.UserId, user.Role?.RoleName ?? "User");
                    user.TokenJwt = refreshToken;
                    user.UpdatedAt = DateTime.Now;
                    await _userRepository.UpdateAsync(user, ct);
                }
            }
            else
            {
                // Business logic: Generate new refresh token
                refreshToken = _tokenService.GenerateRefreshToken(user.UserId, user.Role?.RoleName ?? "User");
                user.TokenJwt = refreshToken;
                user.UpdatedAt = DateTime.Now;
                await _userRepository.UpdateAsync(user, ct);
            }

            return new
            {
                Message = "Đăng nhập thành công",
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                IsProfileComplete = user.IsProfileComplete
            };
        }

        public async Task<object> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                throw new ArgumentException("Refresh Token không được để trống");

            // Business logic: Validate refresh token
            var principal = _tokenService.GetPrincipalFromToken(request.RefreshToken, validateLifetime: true);
            if (principal == null)
                throw new UnauthorizedAccessException("Refresh Token không hợp lệ hoặc đã hết hạn");

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                throw new UnauthorizedAccessException("Không thể xác định người dùng từ token");

            // Business logic: Verify token in database
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId, ct);
            if (user == null || user.TokenJwt != request.RefreshToken)
                throw new UnauthorizedAccessException("Refresh Token không hợp lệ hoặc đã bị thu hồi");

            // Business logic: Generate new tokens
            var newAccessToken = _tokenService.GenerateAccessToken(user.UserId, user.Role?.RoleName ?? "User");
            var newRefreshToken = _tokenService.GenerateRefreshToken(user.UserId, user.Role?.RoleName ?? "User");

            user.TokenJwt = newRefreshToken;
            user.UpdatedAt = DateTime.Now;
            await _userRepository.UpdateAsync(user, ct);

            return new
            {
                Message = "Làm mới token thành công",
                AccessToken = newAccessToken
            };
        }

        public async Task<bool> LogoutAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng.");

            user.UpdatedAt = DateTime.Now;
            await _userRepository.UpdateAsync(user, ct);

            return true;
        }
    }
}

