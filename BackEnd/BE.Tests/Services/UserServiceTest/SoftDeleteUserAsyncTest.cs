using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserServiceTest
{
    public class SoftDeleteUserAsyncTest
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly PasswordService _passwordService;
        private readonly UserService _userService;

        public SoftDeleteUserAsyncTest()
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
        /// UTCID01: Normal case - UserId > 0, User exists, IsDeleted = null/false
        /// Condition: User exists and not already deleted
        /// Expected: Returns true, UpdateAsync called, IsDeleted set to true, UpdatedAt set
        /// </summary>
        [Fact]
        public async Task UTCID01_SoftDeleteUserAsync_UserExistsNotDeleted_ReturnsTrue()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();
            var originalUpdatedAt = DateTime.Now.AddDays(-1);

            var existingUser = new User
            {
                UserId = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                IsDeleted = false,
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = originalUpdatedAt
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingUser);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.SoftDeleteUserAsync(userId, cancellationToken);

            // Assert
            Assert.True(result);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetByIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.Is<User>(u => 
                    u.UserId == userId &&
                    u.IsDeleted == true &&
                    u.UpdatedAt > originalUpdatedAt), cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Boundary case - UserId = 0
        /// Condition: UserId = 0, user not found
        /// Expected: Returns false, UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID02_SoftDeleteUserAsync_UserIdZero_ReturnsFalse()
        {
            // Arrange
            int userId = 0;
            var cancellationToken = new CancellationToken();

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.SoftDeleteUserAsync(userId, cancellationToken);

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
        /// UTCID03: Boundary case - UserId < 0
        /// Condition: UserId negative, user not found
        /// Expected: Returns false, UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID03_SoftDeleteUserAsync_UserIdNegative_ReturnsFalse()
        {
            // Arrange
            int userId = -1;
            var cancellationToken = new CancellationToken();

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.SoftDeleteUserAsync(userId, cancellationToken);

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
        /// UTCID04: Normal case - UserId > 0, User does not exist
        /// Condition: Valid userId but user not in database
        /// Expected: Returns false, UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID04_SoftDeleteUserAsync_UserNotFound_ReturnsFalse()
        {
            // Arrange
            int userId = 999;
            var cancellationToken = new CancellationToken();

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.SoftDeleteUserAsync(userId, cancellationToken);

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
        /// UTCID05: Edge case - User exists but already deleted (IsDeleted = true)
        /// Condition: User exists but IsDeleted is already true
        /// Expected: Returns true (already deleted), UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID05_SoftDeleteUserAsync_UserAlreadyDeleted_ReturnsTrue()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            var existingUser = new User
            {
                UserId = userId,
                FullName = "Deleted User",
                Email = "deleted@example.com",
                PasswordHash = "hashedpassword",
                IsDeleted = true, // Already deleted
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = DateTime.Now.AddDays(-1)
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingUser);

            // Act
            var result = await _userService.SoftDeleteUserAsync(userId, cancellationToken);

            // Assert
            Assert.True(result); // Returns true because user is already deleted

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
