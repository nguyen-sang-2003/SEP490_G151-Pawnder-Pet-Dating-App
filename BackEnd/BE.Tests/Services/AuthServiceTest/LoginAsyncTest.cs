using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BE.Tests.Services.AuthServiceTest
{
    public class LoginAsyncTest : IDisposable
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PasswordService _passwordService;
        private readonly TokenService _tokenService;
        private readonly AuthService _service;

        public LoginAsyncTest()
        {
            _mockUserRepository = new Mock<IUserRepository>();

            var inMemorySettings = new Dictionary<string, string>
            {
                { "Jwt:Secret", "super_secret_key_12345678901234567890123456789012" },
                { "Jwt:Issuer", "test-issuer" },
                { "Jwt:Audience", "test-audience" },
                { "Jwt:AccessTokenExpirationMinutes", "60" },
                { "Jwt:RefreshTokenExpirationDays", "30" }
            };
            IConfiguration config = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"AuthServiceDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _passwordService = new PasswordService();
            _tokenService = new TokenService(config);
            _service = new AuthService(_mockUserRepository.Object, _context, _passwordService, _tokenService);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private User BuildUser(int id, string email, string passwordHash, int roleId = 3, bool isDeleted = false, string? tokenJwt = null)
        {
            return new User
            {
                UserId = id,
                Email = email,
                FullName = "Test User",
                PasswordHash = passwordHash,
                RoleId = roleId,
                Role = new Role { RoleId = roleId, RoleName = roleId == 1 ? "Admin" : roleId == 2 ? "Expert" : "User" },
                IsDeleted = isDeleted,
                TokenJwt = tokenJwt,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                IsProfileComplete = true
            };
        }

        private static string LegacySha256(string password)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }

        /// <summary>
        /// UTCID01: Email exists, correct password (BCrypt), no refresh token -> success.
        /// </summary>
        [Fact]
        public async Task UTCID01_LoginAsync_ValidUser_NoRefreshToken_ReturnsSuccess()
        {
            // Arrange
            const string email = "user@example.com";
            const string password = "correctPassword";
            var hash = _passwordService.HashPassword(password);
            var user = BuildUser(1, email, hash, roleId: 3, tokenJwt: null);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new LoginRequest { Email = email, Password = password, Platform = "user" };

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            var resultType = result.GetType();
            Assert.Equal("Đăng nhập thành công", resultType.GetProperty("Message")?.GetValue(result));
            Assert.NotNull(resultType.GetProperty("AccessToken")?.GetValue(result));
            Assert.NotNull(resultType.GetProperty("RefreshToken")?.GetValue(result));
            Assert.Equal(user.UserId, resultType.GetProperty("UserId")?.GetValue(result));
        }

        /// <summary>
        /// UTCID02: Email exists, correct password, existing valid refresh token -> reuse token.
        /// </summary>
        [Fact]
        public async Task UTCID02_LoginAsync_ValidUser_ReuseValidRefreshToken()
        {
            // Arrange
            const string email = "user@example.com";
            const string password = "correctPassword";
            var hash = _passwordService.HashPassword(password);
            var existingRefresh = _tokenService.GenerateRefreshToken(1, "User");
            var user = BuildUser(1, email, hash, roleId: 3, tokenJwt: existingRefresh);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new LoginRequest { Email = email, Password = password, Platform = "user" };

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            var refresh = result.GetType().GetProperty("RefreshToken")?.GetValue(result)?.ToString();
            Assert.Equal(existingRefresh, refresh);
        }

        /// <summary>
        /// UTCID03: Email exists, correct password, refresh token invalid/expired -> new token generated.
        /// </summary>
        [Fact]
        public async Task UTCID03_LoginAsync_InvalidExistingRefreshToken_GeneratesNew()
        {
            // Arrange
            const string email = "user@example.com";
            const string password = "correctPassword";
            var hash = _passwordService.HashPassword(password);
            var user = BuildUser(1, email, hash, roleId: 3, tokenJwt: "invalid-token");

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new LoginRequest { Email = email, Password = password, Platform = "user" };

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            var refresh = result.GetType().GetProperty("RefreshToken")?.GetValue(result)?.ToString();
            Assert.NotEqual("invalid-token", refresh);
            _mockUserRepository.Verify(r => r.UpdateAsync(It.Is<User>(u => u.TokenJwt == refresh), It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID04: Legacy SHA256 password -> verified and upgraded.
        /// </summary>
        [Fact]
        public async Task UTCID04_LoginAsync_LegacySha256Password_IsUpgraded()
        {
            // Arrange
            const string email = "user@example.com";
            const string password = "correctPassword";
            var legacyHash = LegacySha256(password);
            var user = BuildUser(1, email, legacyHash, roleId: 3, tokenJwt: null);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new LoginRequest { Email = email, Password = password, Platform = "user" };

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            Assert.Equal("Đăng nhập thành công", result.GetType().GetProperty("Message")?.GetValue(result));
            _mockUserRepository.Verify(r => r.UpdateAsync(It.Is<User>(u => u.PasswordHash.StartsWith("$2")), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        }

        /// <summary>
        /// UTCID05: Email exists, correct password, Admin platform with allowed role -> success.
        /// </summary>
        [Fact]
        public async Task UTCID05_LoginAsync_AdminPlatformAllowedRole_Succeeds()
        {
            // Arrange
            const string email = "user@example.com";
            const string password = "correctPassword";
            var hash = _passwordService.HashPassword(password);
            var user = BuildUser(1, email, hash, roleId: 1, tokenJwt: null);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new LoginRequest { Email = email, Password = password, Platform = "admin" };

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            Assert.Equal("Đăng nhập thành công", result.GetType().GetProperty("Message")?.GetValue(result));
        }

        /// <summary>
        /// UTCID06: Email not found -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID06_LoginAsync_UserNotFound_ThrowsUnauthorized()
        {
            // Arrange
            const string email = "notfound@example.com";
            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            var request = new LoginRequest { Email = email, Password = "password" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.LoginAsync(request));
            Assert.Equal("Tài khoản không tồn tại", ex.Message);
        }

        /// <summary>
        /// UTCID07: Wrong password -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID07_LoginAsync_WrongPassword_ThrowsUnauthorized()
        {
            // Arrange
            const string email = "user@example.com";
            var hash = _passwordService.HashPassword("correctPassword");
            var user = BuildUser(1, email, hash);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            var request = new LoginRequest { Email = email, Password = "wrongPassword" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.LoginAsync(request));
            Assert.Equal("Sai mật khẩu", ex.Message);
        }

        /// <summary>
        /// UTCID08: Admin platform but role not allowed -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID08_LoginAsync_AdminPlatformUserRoleDenied()
        {
            // Arrange
            const string email = "user@example.com";
            var hash = _passwordService.HashPassword("correctPassword");
            var user = BuildUser(1, email, hash, roleId: 3);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            var request = new LoginRequest { Email = email, Password = "correctPassword", Platform = "admin" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.LoginAsync(request));
            Assert.Contains("Admin hoặc Expert", ex.Message);
        }

        /// <summary>
        /// UTCID09: User platform but role is admin -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID09_LoginAsync_UserPlatformAdminRoleDenied()
        {
            // Arrange
            const string email = "user@example.com";
            var hash = _passwordService.HashPassword("correctPassword");
            var user = BuildUser(1, email, hash, roleId: 1);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            var request = new LoginRequest { Email = email, Password = "correctPassword", Platform = "user" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.LoginAsync(request));
            Assert.Contains("User mới có thể", ex.Message);
        }

        /// <summary>
        /// UTCID10: Active temporary ban (future end) -> InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID10_LoginAsync_TemporaryBan_ThrowsInvalidOperation()
        {
            // Arrange
            const string email = "user@example.com";
            var hash = _passwordService.HashPassword("correctPassword");
            var user = BuildUser(1, email, hash);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _context.UserBanHistories.Add(new UserBanHistory
            {
                UserId = user.UserId,
                BanStart = DateTime.Now.AddDays(-1),
                BanEnd = DateTime.Now.AddDays(1),
                IsActive = true,
                BanReason = "Test"
            });
            await _context.SaveChangesAsync();

            var request = new LoginRequest { Email = email, Password = "correctPassword", Platform = "user" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.LoginAsync(request));
            Assert.Contains("tạm thời", ex.Message);
        }

        /// <summary>
        /// UTCID11: Active permanent ban (no end) -> InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID11_LoginAsync_PermanentBan_ThrowsInvalidOperation()
        {
            // Arrange
            const string email = "user@example.com";
            var hash = _passwordService.HashPassword("correctPassword");
            var user = BuildUser(1, email, hash);

            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _context.UserBanHistories.Add(new UserBanHistory
            {
                UserId = user.UserId,
                BanStart = DateTime.Now.AddDays(-2),
                BanEnd = null,
                IsActive = true,
                BanReason = "Permanent"
            });
            await _context.SaveChangesAsync();

            var request = new LoginRequest { Email = email, Password = "correctPassword", Platform = "user" };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.LoginAsync(request));
            Assert.Contains("vĩnh viễn", ex.Message);
        }

        /// <summary>
        /// UTCID12: Email null -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID12_LoginAsync_EmailNull_ThrowsUnauthorized()
        {
            // Arrange
            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(null!, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            var request = new LoginRequest { Email = null, Password = "password" };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.LoginAsync(request));
        }

        /// <summary>
        /// UTCID13: Email empty/whitespace -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID13_LoginAsync_EmailEmpty_ThrowsUnauthorized()
        {
            // Arrange
            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(string.Empty, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            var request = new LoginRequest { Email = "   ", Password = "password" };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.LoginAsync(request));
        }
    }
}

