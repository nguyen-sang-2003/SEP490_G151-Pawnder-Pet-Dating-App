using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;

namespace BE.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly PasswordService _passwordService;

        public UserService(IUserRepository userRepository, PasswordService passwordService)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
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
            // Validate pagination
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 200) pageSize = 20;

            return await _userRepository.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, ct);
        }

        public async Task<UserResponse?> GetUserByIdAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetUserByIdAsync(userId, false, ct);
            
            if (user == null)
                return null;

            return new UserResponse
            {
                UserId = user.UserId,
                RoleId = user.RoleId,
                UserStatusId = user.UserStatusId,
                AddressId = user.AddressId,
                FullName = user.FullName,
                Gender = user.Gender,
                Email = user.Email,
                ProviderLogin = user.ProviderLogin,
                IsDeleted = user.IsDeleted ?? false,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }

        public async Task<UserResponse> RegisterAsync(UserCreateRequest req, CancellationToken ct = default)
        {
            var email = req.Email?.Trim();
            var password = req.Password?.Trim();

            // Business logic: Check email exists
            var emailExists = await _userRepository.EmailExistsAsync(email!, ct);
            if (emailExists)
                throw new InvalidOperationException("Email đã tồn tại");

            // Business logic: Hash password
            var hashed = _passwordService.HashPassword(password!);

            var entity = new User
            {
                RoleId = req.RoleId,
                UserStatusId = req.UserStatusId,
                FullName = req.FullName?.Trim(),
                Gender = req.Gender,
                Email = email!,
                PasswordHash = hashed,
                ProviderLogin = req.ProviderLogin,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _userRepository.AddAsync(entity, ct);

            return new UserResponse
            {
                UserId = entity.UserId,
                RoleId = entity.RoleId,
                UserStatusId = entity.UserStatusId,
                AddressId = entity.AddressId,
                FullName = entity.FullName,
                Gender = entity.Gender,
                Email = entity.Email,
                ProviderLogin = entity.ProviderLogin,
                IsDeleted = entity.IsDeleted ?? false,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }

        public async Task<UserResponse> UpdateUserAsync(int userId, UserUpdateRequest req, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng");

            // Business logic: Update user
            user.RoleId = req.RoleId;

            if (req.AddressId.HasValue)
                user.AddressId = req.AddressId;

            user.FullName = req.FullName;
            user.Gender = req.Gender;

            if (!string.IsNullOrWhiteSpace(req.NewPassword))
            {
                // TODO: Hash password properly
                user.PasswordHash = req.NewPassword;
            }

            user.UpdatedAt = DateTime.Now;

            await _userRepository.UpdateAsync(user, ct);

            return new UserResponse
            {
                UserId = user.UserId,
                RoleId = user.RoleId,
                UserStatusId = user.UserStatusId,
                AddressId = user.AddressId,
                FullName = user.FullName,
                Gender = user.Gender,
                Email = user.Email,
                ProviderLogin = user.ProviderLogin,
                IsDeleted = user.IsDeleted ?? false,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }

        public async Task<bool> SoftDeleteUserAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null)
                return false;

            if (user.IsDeleted == true)
                return true; // Already deleted

            // Business logic: Soft delete
            user.IsDeleted = true;
            user.UpdatedAt = DateTime.Now;

            await _userRepository.UpdateAsync(user, ct);
            return true;
        }

        public async Task<bool> CompleteProfileAsync(int id, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(id, ct);
            if (user == null)
                return false;

            // Business logic: Mark profile as complete
            user.IsProfileComplete = true;
            user.UpdatedAt = DateTime.Now;

            await _userRepository.UpdateAsync(user, ct);
            return true;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.NewPassword))
                throw new ArgumentException("Email và mật khẩu mới là bắt buộc");

            var email = request.Email.Trim();
            var newPassword = request.NewPassword.Trim();

            var user = await _userRepository.GetUserByEmailAsync(email, ct);
            if (user == null)
                throw new KeyNotFoundException("Email không tồn tại");

            // Business logic: Hash new password and clear token
            user.PasswordHash = _passwordService.HashPassword(newPassword);
            user.TokenJwt = null; // Clear old token for security
            user.UpdatedAt = DateTime.Now;

            await _userRepository.UpdateAsync(user, ct);
            return true;
        }
    }
}

