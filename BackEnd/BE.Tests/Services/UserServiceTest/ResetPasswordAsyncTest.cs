using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserServiceTest
{
    public class ResetPasswordAsyncTest
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly PasswordService _passwordService;
        private readonly UserService _userService;

        public ResetPasswordAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockUserRepository = new Mock<IUserRepository>();
            _passwordService = new PasswordService();

            // Khởi tạo service
            _userService = new UserService(
                _mockUserRepository.Object,
                _passwordService
            );
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Exception case - Email is null
        /// Condition: Email is null, NewPassword is null
        /// Expected: Throws ArgumentException, no repository calls
        /// </summary>
        [Fact]
        public async Task UTCID01_ResetPasswordAsync_EmailNull_ThrowsArgumentException()
        {
            // Arrange
            var cancellationToken = new CancellationToken();

            var request = new ResetPasswordRequest
            {
                Email = null!,
                NewPassword = null!
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _userService.ResetPasswordAsync(request, cancellationToken));

            Assert.Equal("Email và mật khẩu mới là bắt buộc", exception.Message);

            // Verify repository interaction - no calls made
            _mockUserRepository.Verify(
                r => r.GetUserByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Never);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID02: Exception case - Email is empty/whitespace
        /// Condition: Email is "" or " ", NewPassword exists
        /// Expected: Throws ArgumentException, no repository calls
        /// </summary>
        [Fact]
        public async Task UTCID02_ResetPasswordAsync_EmailEmpty_ThrowsArgumentException()
        {
            // Arrange
            var cancellationToken = new CancellationToken();

            var request = new ResetPasswordRequest
            {
                Email = "   ", // Whitespace only
                NewPassword = "newpassword123"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _userService.ResetPasswordAsync(request, cancellationToken));

            Assert.Equal("Email và mật khẩu mới là bắt buộc", exception.Message);

            // Verify repository interaction - no calls made
            _mockUserRepository.Verify(
                r => r.GetUserByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Normal case - Valid email, user exists
        /// Condition: Email exists in database, user found
        /// Expected: Returns true, GetUserByEmailAsync and UpdateAsync called once
        /// </summary>
        [Fact]
        public async Task UTCID03_ResetPasswordAsync_ValidEmailUserExists_ReturnsTrue()
        {
            // Arrange
            var cancellationToken = new CancellationToken();
            var email = "test@example.com";
            var originalPasswordHash = "oldhash";

            var request = new ResetPasswordRequest
            {
                Email = email,
                NewPassword = "newpassword123"
            };

            var existingUser = new User
            {
                UserId = 1,
                Email = email,
                PasswordHash = originalPasswordHash,
                TokenJwt = "oldtoken",
                UpdatedAt = DateTime.Now.AddDays(-1)
            };

            _mockUserRepository
                .Setup(r => r.GetUserByEmailAsync(email, cancellationToken))
                .ReturnsAsync(existingUser);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.ResetPasswordAsync(request, cancellationToken);

            // Assert
            Assert.True(result);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetUserByEmailAsync(email, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.Is<User>(u => 
                    u.Email == email &&
                    u.PasswordHash != originalPasswordHash && // Password changed
                    u.TokenJwt == null), cancellationToken), // Token cleared
                Times.Once);
        }

        /// <summary>
        /// UTCID04: Exception case - Valid email, user does not exist
        /// Condition: Email valid format, user not found in database
        /// Expected: Throws KeyNotFoundException, UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID04_ResetPasswordAsync_UserNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            var cancellationToken = new CancellationToken();
            var email = "notexist@example.com";

            var request = new ResetPasswordRequest
            {
                Email = email,
                NewPassword = "newpassword123"
            };

            _mockUserRepository
                .Setup(r => r.GetUserByEmailAsync(email, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _userService.ResetPasswordAsync(request, cancellationToken));

            Assert.Equal("Email không tồn tại", exception.Message);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetUserByEmailAsync(email, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        #endregion
    }
}
