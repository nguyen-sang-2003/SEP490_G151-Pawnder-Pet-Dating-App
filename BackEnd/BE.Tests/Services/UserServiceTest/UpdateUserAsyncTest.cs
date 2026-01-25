using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserServiceTest
{
    public class UpdateUserAsyncTest
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly PasswordService _passwordService;
        private readonly UserService _userService;

        public UpdateUserAsyncTest()
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
        /// UTCID01: Normal case - User exists, NewPassword is null/empty
        /// Condition: User exists, NewPassword is null/empty, only FullName/Gender updated
        /// Expected: UserResponse returned, UpdateAsync called once, PasswordHash not changed
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdateUserAsync_UserExistsNoNewPassword_ReturnsUserResponse()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();
            var originalPasswordHash = "originalhashedpassword";

            var existingUser = new User
            {
                UserId = userId,
                RoleId = 3,
                UserStatusId = 1,
                FullName = "Old Name",
                Gender = "Male",
                Email = "test@example.com",
                PasswordHash = originalPasswordHash,
                IsDeleted = false,
                CreatedAt = DateTime.Now.AddDays(-1),
                UpdatedAt = DateTime.Now.AddDays(-1)
            };

            var request = new UserUpdateRequest
            {
                FullName = "New Name",
                Gender = "Female",
                AddressId = null,
                NewPassword = null // No password change
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingUser);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.UpdateUserAsync(userId, request, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(request.FullName, result.FullName);
            Assert.Equal(request.Gender, result.Gender);
            Assert.NotNull(result.UpdatedAt);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetByIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.Is<User>(u => 
                    u.UserId == userId &&
                    u.FullName == request.FullName &&
                    u.Gender == request.Gender &&
                    u.PasswordHash == originalPasswordHash), cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Exception case - User not found
        /// Condition: User does not exist in database
        /// Expected: Throws KeyNotFoundException, UpdateAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdateUserAsync_UserNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int userId = 999;
            var cancellationToken = new CancellationToken();

            var request = new UserUpdateRequest
            {
                FullName = "New Name",
                Gender = "Male"
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync((User?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _userService.UpdateUserAsync(userId, request, cancellationToken));

            Assert.Equal("Không tìm thấy người dùng", exception.Message);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetByIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Normal case - AddressId has value
        /// Condition: User exists, AddressId provided in request
        /// Expected: UserResponse returned, AddressId updated
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdateUserAsync_AddressIdProvided_AddressIdUpdated()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();
            int newAddressId = 5;

            var existingUser = new User
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
                CreatedAt = DateTime.Now.AddDays(-1),
                UpdatedAt = DateTime.Now.AddDays(-1)
            };

            var request = new UserUpdateRequest
            {
                FullName = "Updated Name",
                Gender = "Male",
                AddressId = newAddressId // Provided AddressId
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingUser);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.UpdateUserAsync(userId, request, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(newAddressId, result.AddressId);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.Is<User>(u => 
                    u.AddressId == newAddressId), cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID04: Normal case - FullName/Gender updated from request
        /// Condition: User exists, FullName and Gender provided
        /// Expected: UserResponse returned with updated FullName/Gender
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdateUserAsync_FullNameGenderUpdated_ReturnsUpdatedResponse()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            var existingUser = new User
            {
                UserId = userId,
                RoleId = 3,
                UserStatusId = 1,
                FullName = "Old Name",
                Gender = "Male",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                IsDeleted = false,
                CreatedAt = DateTime.Now.AddDays(-1),
                UpdatedAt = DateTime.Now.AddDays(-1)
            };

            var request = new UserUpdateRequest
            {
                FullName = "Updated Full Name",
                Gender = "Other"
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingUser);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.UpdateUserAsync(userId, request, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(request.FullName, result.FullName);
            Assert.Equal(request.Gender, result.Gender);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.Is<User>(u => 
                    u.FullName == request.FullName &&
                    u.Gender == request.Gender), cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID05: Normal case - NewPassword is non-empty
        /// Condition: User exists, NewPassword provided
        /// Expected: UserResponse returned, PasswordHash updated
        /// </summary>
        [Fact]
        public async Task UTCID05_UpdateUserAsync_NewPasswordProvided_PasswordHashUpdated()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();
            var originalPasswordHash = "oldhash";
            var newPassword = "newpassword123";

            var existingUser = new User
            {
                UserId = userId,
                RoleId = 3,
                UserStatusId = 1,
                FullName = "Test User",
                Gender = "Male",
                Email = "test@example.com",
                PasswordHash = originalPasswordHash,
                IsDeleted = false,
                CreatedAt = DateTime.Now.AddDays(-1),
                UpdatedAt = DateTime.Now.AddDays(-1)
            };

            var request = new UserUpdateRequest
            {
                FullName = "Test User",
                Gender = "Male",
                NewPassword = newPassword
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingUser);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userService.UpdateUserAsync(userId, request, cancellationToken);

            // Assert
            Assert.NotNull(result);

            // Verify repository interaction - PasswordHash should be updated (not the same as original)
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.Is<User>(u => 
                    u.PasswordHash == newPassword), cancellationToken),
                Times.Once);
        }

        #endregion
    }
}
