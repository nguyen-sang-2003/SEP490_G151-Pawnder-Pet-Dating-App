using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserServiceTest
{
    public class GetUserByIdAsyncTest
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly PasswordService _passwordService;
        private readonly UserService _userService;

        public GetUserByIdAsyncTest()
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
        /// UTCID01: Normal case - UserId > 0, Repository returns User
        /// Condition: UserId > 0, repository returns valid User
        /// Expected: UserResponse mapped correctly, GetUserByIdAsync called once with correct parameters
        /// </summary>
        [Fact]
        public async Task UTCID01_GetUserByIdAsync_ValidUserId_ReturnsUserResponse()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            var user = new User
            {
                UserId = userId,
                RoleId = 3,
                UserStatusId = 1,
                AddressId = 1,
                FullName = "Test User",
                Gender = "Male",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockUserRepository
                .Setup(r => r.GetUserByIdAsync(userId, false, cancellationToken))
                .ReturnsAsync(user);

            // Act
            var result = await _userService.GetUserByIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(user.UserId, result.UserId);
            Assert.Equal(user.Email, result.Email);
            Assert.Equal(user.FullName, result.FullName);
            Assert.Equal(user.Gender, result.Gender);
            Assert.Equal(user.RoleId, result.RoleId);
            Assert.Equal(user.UserStatusId, result.UserStatusId);
            Assert.False(result.IsDeleted);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetUserByIdAsync(userId, false, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Normal case - UserId > 0, Repository returns null
        /// Condition: UserId > 0, repository returns null (user not found)
        /// Expected: null returned, GetUserByIdAsync called once
        /// </summary>
        [Fact]
        public async Task UTCID02_GetUserByIdAsync_ValidUserIdNotFound_ReturnsNull()
        {
            // Arrange
            int userId = 999;
            var cancellationToken = new CancellationToken();

            _mockUserRepository
                .Setup(r => r.GetUserByIdAsync(userId, false, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.GetUserByIdAsync(userId, cancellationToken);

            // Assert
            Assert.Null(result);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetUserByIdAsync(userId, false, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID03: Boundary case - UserId <= 0
        /// Condition: UserId <= 0 (invalid), repository returns null
        /// Expected: null returned, repository still called with the provided userId
        /// </summary>
        [Fact]
        public async Task UTCID03_GetUserByIdAsync_InvalidUserId_ReturnsNull()
        {
            // Arrange
            int userId = 0;
            var cancellationToken = new CancellationToken();

            _mockUserRepository
                .Setup(r => r.GetUserByIdAsync(userId, false, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.GetUserByIdAsync(userId, cancellationToken);

            // Assert
            Assert.Null(result);

            // Verify repository interaction - userId preserved
            _mockUserRepository.Verify(
                r => r.GetUserByIdAsync(userId, false, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID04: Normal case - User with IsDeleted = null
        /// Condition: UserId > 0, repository returns User with IsDeleted = null
        /// Expected: UserResponse returned with IsDeleted defaults to false
        /// </summary>
        [Fact]
        public async Task UTCID04_GetUserByIdAsync_IsDeletedNull_DefaultsToFalse()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            var user = new User
            {
                UserId = userId,
                RoleId = 3,
                UserStatusId = 1,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                IsDeleted = null, // null should default to false
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockUserRepository
                .Setup(r => r.GetUserByIdAsync(userId, false, cancellationToken))
                .ReturnsAsync(user);

            // Act
            var result = await _userService.GetUserByIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(user.UserId, result.UserId);
            Assert.Equal(user.Email, result.Email);
            Assert.Equal(user.FullName, result.FullName);
            Assert.False(result.IsDeleted); // IsDeleted should default to false

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetUserByIdAsync(userId, false, cancellationToken),
                Times.Once);
        }

        #endregion
    }
}
