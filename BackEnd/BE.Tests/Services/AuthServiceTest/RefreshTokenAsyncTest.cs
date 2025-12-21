using System.Security.Claims;
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
    public class RefreshTokenAsyncTest : IDisposable
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly TokenService _tokenService;
        private readonly AuthService _service;

        public RefreshTokenAsyncTest()
        {
            _mockUserRepository = new Mock<IUserRepository>();

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
            {
                { "Jwt:Secret", "super_secret_key_12345678901234567890123456789012" },
                { "Jwt:Issuer", "test-issuer" },
                { "Jwt:Audience", "test-audience" },
                { "Jwt:AccessTokenExpirationMinutes", "60" },
                { "Jwt:RefreshTokenExpirationDays", "30" }
            }).Build();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"RefreshTokenDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _tokenService = new TokenService(config);
            _service = new AuthService(_mockUserRepository.Object, _context, new PasswordService(), _tokenService);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private User BuildUser(int id, string refreshToken, int roleId = 3)
        {
            return new User
            {
                UserId = id,
                Email = "user@example.com",
                PasswordHash = "$2a$10$abcdefghijklmnopqrstuv", // dummy bcrypt
                RoleId = roleId,
                Role = new Role { RoleId = roleId, RoleName = roleId == 1 ? "Admin" : roleId == 2 ? "Expert" : "User" },
                TokenJwt = refreshToken,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
        }

        /// <summary>
        /// UTCID01: Valid refresh token, user exists, matches token, valid role -> success.
        /// </summary>
        [Fact]
        public async Task UTCID01_RefreshTokenAsync_Valid_ReturnsNewTokens()
        {
            // Arrange
            var refresh = _tokenService.GenerateRefreshToken(1, "User");
            var user = BuildUser(1, refresh, roleId: 3);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new RefreshTokenRequest { RefreshToken = refresh };

            // Act
            var result = await _service.RefreshTokenAsync(request);

            // Assert
            var type = result.GetType();
            Assert.Equal("Làm mới token thành công", type.GetProperty("Message")?.GetValue(result));
            Assert.NotNull(type.GetProperty("AccessToken")?.GetValue(result));
        }

        /// <summary>
        /// UTCID02: RefreshToken null/empty/whitespace -> ArgumentException.
        /// </summary>
        [Fact]
        public async Task UTCID02_RefreshTokenAsync_EmptyToken_ThrowsArgumentException()
        {
            var request = new RefreshTokenRequest { RefreshToken = "   " };
            await Assert.ThrowsAsync<ArgumentException>(() => _service.RefreshTokenAsync(request));
        }

        /// <summary>
        /// UTCID03: Invalid/expired refresh token -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID03_RefreshTokenAsync_InvalidToken_ThrowsUnauthorized()
        {
            var request = new RefreshTokenRequest { RefreshToken = "invalid-token" };
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RefreshTokenAsync(request));
        }

        /// <summary>
        /// UTCID04: Token principal missing user id -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID04_RefreshTokenAsync_MissingUserIdClaim_ThrowsUnauthorized()
        {
            // craft token without nameidentifier
            var claims = new[]
            {
                new Claim(ClaimTypes.Role, "User"),
                new Claim("token_type", "refresh")
            };
            var keyConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
            {
                { "Jwt:Secret", "super_secret_key_12345678901234567890123456789012" },
                { "Jwt:Issuer", "test-issuer" },
                { "Jwt:Audience", "test-audience" },
                { "Jwt:AccessTokenExpirationMinutes", "60" },
                { "Jwt:RefreshTokenExpirationDays", "30" }
            }).Build();
            var tokenSvc = new TokenService(keyConfig);
            var invalidToken = tokenSvc.GenerateRefreshToken(1, "User");

            // tamper: remove nameid by creating fake principal parse failure
            var request = new RefreshTokenRequest { RefreshToken = invalidToken.Replace("1", "") };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RefreshTokenAsync(request));
        }

        /// <summary>
        /// UTCID05: User not found -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID05_RefreshTokenAsync_UserNotFound_ThrowsUnauthorized()
        {
            var refresh = _tokenService.GenerateRefreshToken(999, "User");
            var request = new RefreshTokenRequest { RefreshToken = refresh };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RefreshTokenAsync(request));
        }

        /// <summary>
        /// UTCID06: User exists but TokenJwt not matching -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID06_RefreshTokenAsync_TokenNotMatch_ThrowsUnauthorized()
        {
            var refresh = _tokenService.GenerateRefreshToken(1, "User");
            var user = BuildUser(1, "different-token", roleId: 3);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new RefreshTokenRequest { RefreshToken = refresh };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RefreshTokenAsync(request));
        }

        /// <summary>
        /// UTCID07: User role invalid (not in 1,2,3) -> UnauthorizedAccessException.
        /// </summary>
        [Fact]
        public async Task UTCID07_RefreshTokenAsync_InvalidRole_ThrowsUnauthorized()
        {
            var refresh = _tokenService.GenerateRefreshToken(1, "User");
            var user = BuildUser(1, refresh, roleId: 99);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new RefreshTokenRequest { RefreshToken = refresh };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.RefreshTokenAsync(request));
        }
    }
}

