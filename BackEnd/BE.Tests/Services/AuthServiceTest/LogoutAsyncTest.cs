using System.Collections.Generic;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BE.Tests.Services.AuthServiceTest
{
    public class LogoutAsyncTest
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<PawnderDatabaseContext> _mockContext;
        private readonly AuthService _service;

        public LogoutAsyncTest()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _mockContext = new Mock<PawnderDatabaseContext>();

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
            {
                { "Jwt:Secret", "super_secret_key_12345678901234567890123456789012" },
                { "Jwt:Issuer", "test-issuer" },
                { "Jwt:Audience", "test-audience" },
                { "Jwt:AccessTokenExpirationMinutes", "60" },
                { "Jwt:RefreshTokenExpirationDays", "30" }
            }).Build();

            _service = new AuthService(_mockUserRepository.Object, _mockContext.Object, new PasswordService(), new TokenService(config));
        }

        /// <summary>
        /// UTCID01: user exists -> returns true, clears token.
        /// </summary>
        [Fact]
        public async Task UTCID01_LogoutAsync_UserExists_ReturnsTrue()
        {
            // Arrange
            var user = new BE.Models.User { UserId = 1, TokenJwt = "refresh-token" };
            _mockUserRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateAsync(It.IsAny<BE.Models.User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.LogoutAsync(1);

            // Assert
            Assert.True(result);
            _mockUserRepository.Verify(r => r.UpdateAsync(It.Is<BE.Models.User>(u => u.UserId == 1), It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID02: user not found -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID02_LogoutAsync_UserNotFound_ThrowsKeyNotFound()
        {
            // Arrange
            _mockUserRepository.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((BE.Models.User?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.LogoutAsync(999));
            Assert.Equal("Không tìm thấy người dùng.", ex.Message);
            _mockUserRepository.Verify(r => r.UpdateAsync(It.IsAny<BE.Models.User>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }
}

