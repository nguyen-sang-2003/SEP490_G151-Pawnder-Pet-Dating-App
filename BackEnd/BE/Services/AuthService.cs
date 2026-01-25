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

        /// <summary>
        /// Kiểm tra và cập nhật user status dựa trên ban history và VIP payment history
        /// </summary>
        private async Task UpdateUserStatusFromHistoryAsync(User user, DateTime now, CancellationToken ct = default)
        {
            // Kiểm tra ban status
            var activeBan = await _context.UserBanHistories
                .AsNoTracking()
                .Where(b => b.UserId == user.UserId && b.IsActive == true)
                .OrderByDescending(b => b.BanStart)
                .FirstOrDefaultAsync(ct);

            bool isBanned = false;
            if (activeBan != null)
            {
                var stillBanned = !activeBan.BanEnd.HasValue || activeBan.BanEnd.Value > now;
                if (stillBanned)
                {
                    isBanned = true;
                }
                else
                {
                    // Auto-deactivate expired ban
                    var banToDeactivate = await _context.UserBanHistories
                        .FirstOrDefaultAsync(b => b.BanId == activeBan.BanId, ct);
                    if (banToDeactivate != null && banToDeactivate.IsActive == true)
                    {
                        banToDeactivate.IsActive = false;
                        banToDeactivate.BanEnd = now;
                        banToDeactivate.UpdatedAt = now;
                        await _context.SaveChangesAsync(ct);
                    }
                }
            }

            // Nếu user bị ban, set status thành "Bị khóa"
            if (isBanned)
            {
                var bannedStatus = await _context.UserStatuses
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => EF.Functions.ILike(s.UserStatusName, "Bị khóa"), ct);
                if (bannedStatus != null && user.UserStatusId != bannedStatus.UserStatusId)
                {
                    user.UserStatusId = bannedStatus.UserStatusId;
                    user.UpdatedAt = now;
                    await _userRepository.UpdateAsync(user, ct);
                }
                return;
            }

            // Nếu không bị ban, kiểm tra VIP status từ payment history
            var today = DateOnly.FromDateTime(now);
            var hasActiveVip = await _context.PaymentHistories
                .AsNoTracking()
                .AnyAsync(ph => ph.UserId == user.UserId
                    && ph.StatusService != null
                    && ph.StatusService.ToLower().Contains("active")
                    && ph.StartDate <= today
                    && ph.EndDate >= today, ct);

            // Cập nhật status dựa trên VIP status
            string targetStatusName;
            if (hasActiveVip)
            {
                targetStatusName = "Tài khoản VIP";
            }
            else
            {
                targetStatusName = "Tài khoản thường";
                
                // Auto chuyển StatusService của PaymentHistory có active sang pending khi chuyển về tài khoản thường
                var activePayments = await _context.PaymentHistories
                    .Where(ph => ph.UserId == user.UserId
                        && ph.StatusService != null
                        && ph.StatusService.ToLower().Contains("active")
                        && ph.EndDate < today)
                    .ToListAsync(ct);

                if (activePayments.Any())
                {
                    foreach (var payment in activePayments)
                    {
                        payment.StatusService = "pending";
                        payment.UpdatedAt = now;
                    }
                    await _context.SaveChangesAsync(ct);
                }
            }

            var targetStatus = await _context.UserStatuses
                .AsNoTracking()
                .FirstOrDefaultAsync(s => EF.Functions.ILike(s.UserStatusName, targetStatusName), ct);

            if (targetStatus != null && user.UserStatusId != targetStatus.UserStatusId)
            {
                user.UserStatusId = targetStatus.UserStatusId;
                user.UpdatedAt = now;
                await _userRepository.UpdateAsync(user, ct);
            }
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

            // Business logic: Validate role based on platform
            var platform = request.Platform?.ToLower() ?? "user"; // Default to user platform
            int[] allowedRoleIds;
            string errorMessage;
            
            if (platform == "admin")
            {
                // Admin/Web platform: Only Admin (1) and Expert (2) allowed
                allowedRoleIds = new[] { 1, 2 };
                errorMessage = "Chỉ tài khoản Admin hoặc Expert mới có thể đăng nhập vào hệ thống quản trị";
            }
            else
            {
                // User/Mobile platform: Only User (3) allowed
                allowedRoleIds = new[] { 3 };
                errorMessage = "Chỉ tài khoản User mới có thể đăng nhập vào ứng dụng này";
            }
            
            if (!user.RoleId.HasValue || !allowedRoleIds.Contains(user.RoleId.Value))
                throw new UnauthorizedAccessException(errorMessage);

            // Business logic: Auto-upgrade legacy SHA256 passwords to BCrypt
            if (_passwordService.IsLegacyHash(user.PasswordHash))
            {
                user.PasswordHash = _passwordService.HashPassword(password!);
                await _userRepository.UpdateAsync(user, ct);
            }

            // Business logic: Check ban status và cập nhật user status từ history
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
                    // Cập nhật status thành "Bị khóa" nếu chưa đúng
                    await UpdateUserStatusFromHistoryAsync(user, now, ct);
                    
                    var message = activeBan.BanEnd.HasValue
                        ? "Tài khoản đang bị khóa tạm thời"
                        : "Tài khoản đã bị khóa vĩnh viễn";
                    throw new InvalidOperationException($"{message}. BanStart: {activeBan.BanStart}, BanEnd: {activeBan.BanEnd}, Reason: {activeBan.BanReason}");
                }
            }

            // Kiểm tra và cập nhật user status từ ban history và VIP payment history
            await UpdateUserStatusFromHistoryAsync(user, now, ct);

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

            // Business logic: Validate role - Only allow User (3), Expert (2), Admin (1)
            var validRoleIds = new[] { 1, 2, 3 }; // Admin, Expert, User
            if (!user.RoleId.HasValue || !validRoleIds.Contains(user.RoleId.Value))
                throw new UnauthorizedAccessException("Tài khoản không có quyền truy cập hệ thống");

            // Business logic: Check ban status và cập nhật user status từ history
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
                    // Cập nhật status thành "Bị khóa" nếu chưa đúng
                    await UpdateUserStatusFromHistoryAsync(user, now, ct);
                    
                    var message = activeBan.BanEnd.HasValue
                        ? "Tài khoản đang bị khóa tạm thời"
                        : "Tài khoản đã bị khóa vĩnh viễn";
                    throw new InvalidOperationException($"{message}. BanStart: {activeBan.BanStart}, BanEnd: {activeBan.BanEnd}, Reason: {activeBan.BanReason}");
                }
            }

            // Kiểm tra và cập nhật user status từ ban history và VIP payment history
            await UpdateUserStatusFromHistoryAsync(user, now, ct);

            // Business logic: Generate new tokens
            var newAccessToken = _tokenService.GenerateAccessToken(user.UserId, user.Role?.RoleName ?? "User");
            var newRefreshToken = _tokenService.GenerateRefreshToken(user.UserId, user.Role?.RoleName ?? "User");

            user.TokenJwt = newRefreshToken;
            user.UpdatedAt = now;
            await _userRepository.UpdateAsync(user, ct);

            return new
            {
                Message = "Làm mới token thành công",
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken // ✅ Fix: Trả về RefreshToken mới
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

        public async Task<object> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
                throw new ArgumentException("Mật khẩu hiện tại và mật khẩu mới là bắt buộc");

            var currentPassword = request.CurrentPassword.Trim();
            var newPassword = request.NewPassword.Trim();

            // BR-22: Validate password complexity
            var (passwordValid, passwordError) = _passwordService.ValidatePasswordComplexity(newPassword);
            if (!passwordValid)
                throw new ArgumentException(passwordError);

            // Business logic: Get user
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng");

            // Business logic: Verify current password
            bool isCurrentPasswordValid = _passwordService.VerifyPassword(currentPassword, user.PasswordHash);
            if (!isCurrentPasswordValid)
                throw new UnauthorizedAccessException("Mật khẩu hiện tại không đúng");

            // Business logic: Check if new password is same as current password
            if (currentPassword == newPassword)
                throw new InvalidOperationException("Mật khẩu mới phải khác mật khẩu hiện tại");

            // Business logic: Hash new password and clear token for security
            user.PasswordHash = _passwordService.HashPassword(newPassword);
            user.TokenJwt = null; // Clear old token to force re-login
            user.UpdatedAt = DateTime.Now;

            await _userRepository.UpdateAsync(user, ct);

            return new { Message = "Đổi mật khẩu thành công. Vui lòng đăng nhập lại." };
        }
    }
}

