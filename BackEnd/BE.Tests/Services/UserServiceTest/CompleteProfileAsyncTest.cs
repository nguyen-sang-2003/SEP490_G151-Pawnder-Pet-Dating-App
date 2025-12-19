using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserServiceTest
{
    public class CompleteProfileAsyncTest
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly PasswordService _passwordService;
        private readonly UserService _userService;

        public CompleteProfileAsyncTest()
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
        /// UTCID01: Normal case - UserId valid, user exists
        /// Condition: UserId > 0, user exists in database
        /// Expected: Returns true, GetByIdAsync and UpdateAsync called
        /// </summary>
        [Fact]
        public async Task UTCID01_CompleteProfileAsync_ValidUserId_ReturnsTrue()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            var existingUser = new User
            {
                UserId = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                IsProfileComplete = false,
                IsDeleted = false,
                CreatedAt = DateTime.Now.AddDays(-1),
                UpdatedAt = DateTime.Now.AddDays(-1)
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingUser);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.CompleteProfileAsync(userId, cancellationToken);

            // Assert
            Assert.True(result);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetByIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.Is<User>(u => 
                    u.UserId == userId &&
                    u.IsProfileComplete == true), cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Normal case - UserId valid but user not found
        /// Condition: UserId > 0, user does not exist in database
        /// Expected: Returns false, UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID02_CompleteProfileAsync_UserNotFound_ReturnsFalse()
        {
            // Arrange
            int userId = 999;
            var cancellationToken = new CancellationToken();

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.CompleteProfileAsync(userId, cancellationToken);

            // Assert
            Assert.False(result);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetByIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Boundary case - UserId = 0
        /// Condition: UserId = 0, user not found
        /// Expected: Returns false, UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID03_CompleteProfileAsync_UserIdZero_ReturnsFalse()
        {
            // Arrange
            int userId = 0;
            var cancellationToken = new CancellationToken();

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.CompleteProfileAsync(userId, cancellationToken);

            // Assert
            Assert.False(result);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetByIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Boundary case - UserId < 0
        /// Condition: UserId negative, user not found
        /// Expected: Returns false, UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID04_CompleteProfileAsync_UserIdNegative_ReturnsFalse()
        {
            // Arrange
            int userId = -1;
            var cancellationToken = new CancellationToken();

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.CompleteProfileAsync(userId, cancellationToken);

            // Assert
            Assert.False(result);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetByIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        #endregion
    }
}
