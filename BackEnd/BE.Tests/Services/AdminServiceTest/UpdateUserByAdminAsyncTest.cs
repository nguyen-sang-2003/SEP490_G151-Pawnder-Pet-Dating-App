using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.AdminServiceTest
{
    public class UpdateUserByAdminAsyncTest
    {
        private readonly Mock<IExpertConfirmationRepository> _mockExpertConfirmationRepository;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<PawnderDatabaseContext> _mockContext;
        private readonly Mock<PasswordService> _mockPasswordService;
        private readonly AdminService? _adminService;

        public UpdateUserByAdminAsyncTest()
        {
            _mockExpertConfirmationRepository = new Mock<IExpertConfirmationRepository>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockContext = new Mock<PawnderDatabaseContext>();
            _mockPasswordService = new Mock<PasswordService>();

            _adminService = new AdminService(
                _mockExpertConfirmationRepository.Object,
                _mockUserRepository.Object,
                _mockContext.Object,
                _mockPasswordService.Object
            );
        }

        /// <summary>
        /// UTCID01: UpdateUserByAdminAsync with both isDelete and userStatusId values provided
        /// Expected: Both fields are updated, returns true
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdateUserByAdminAsync_BothIsDeleteAndUserStatusIdProvided_UpdatesBoth()
        {
            // Arrange
            var userId = 1;
            var user = new User
            {
                UserId = userId,
                Email = "test@example.com",
                IsDeleted = false,
                UserStatusId = 1,
                RoleId = 1,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new AdUserUpdateRequest
            {
                isDelete = true,
                userStatusId = 2
            };

            // Act
            var result = await _adminService!.UpdateUserByAdminAsync(userId, request);

            // Assert
            Assert.True(result);
            Assert.True(user.IsDeleted);
            Assert.Equal(2, user.UserStatusId);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: UpdateUserByAdminAsync with only isDelete provided (userStatusId is null)
        /// Expected: Only isDelete is updated, returns true
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdateUserByAdminAsync_OnlyIsDeleteProvided_UpdatesIsDeleteOnly()
        {
            // Arrange
            var userId = 1;
            var originalStatusId = 1;
            var user = new User
            {
                UserId = userId,
                Email = "test@example.com",
                IsDeleted = false,
                UserStatusId = originalStatusId,
                RoleId = 1,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new AdUserUpdateRequest
            {
                isDelete = true,
                userStatusId = null
            };

            // Act
            var result = await _adminService!.UpdateUserByAdminAsync(userId, request);

            // Assert
            Assert.True(result);
            Assert.True(user.IsDeleted);
            Assert.Equal(originalStatusId, user.UserStatusId); // Unchanged
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID03: UpdateUserByAdminAsync with only userStatusId provided (isDelete is null)
        /// Expected: Only userStatusId is updated, returns true
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdateUserByAdminAsync_OnlyUserStatusIdProvided_UpdatesUserStatusIdOnly()
        {
            // Arrange
            var userId = 1;
            var originalIsDeleted = false;
            var user = new User
            {
                UserId = userId,
                Email = "test@example.com",
                IsDeleted = originalIsDeleted,
                UserStatusId = 1,
                RoleId = 1,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new AdUserUpdateRequest
            {
                isDelete = null,
                userStatusId = 3
            };

            // Act
            var result = await _adminService!.UpdateUserByAdminAsync(userId, request);

            // Assert
            Assert.True(result);
            Assert.Equal(originalIsDeleted, user.IsDeleted); // Unchanged
            Assert.Equal(3, user.UserStatusId);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID04: UpdateUserByAdminAsync with invalid userId (user not found)
        /// Expected: Throws KeyNotFoundException with message "Không tìm thấy user."
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdateUserByAdminAsync_UserNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            var userId = 999; // Non-existent user

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            var request = new AdUserUpdateRequest
            {
                isDelete = true,
                userStatusId = 2
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                async () => await _adminService!.UpdateUserByAdminAsync(userId, request));

            Assert.Equal("Không tìm thấy user.", exception.Message);
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID05: UpdateUserByAdminAsync with no fields provided (all null/default)
        /// Expected: No fields are updated, returns true
        /// </summary>
        [Fact]
        public async Task UTCID05_UpdateUserByAdminAsync_NoFieldsProvided_NoUpdatesPerformed()
        {
            // Arrange
            var userId = 1;
            var originalIsDeleted = false;
            var originalStatusId = 1;
            var user = new User
            {
                UserId = userId,
                Email = "test@example.com",
                IsDeleted = originalIsDeleted,
                UserStatusId = originalStatusId,
                RoleId = 1,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockUserRepository
                .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            _mockUserRepository
                .Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var request = new AdUserUpdateRequest
            {
                isDelete = null,
                userStatusId = null
            };

            // Act
            var result = await _adminService!.UpdateUserByAdminAsync(userId, request);

            // Assert
            Assert.True(result);
            Assert.Equal(originalIsDeleted, user.IsDeleted); // Unchanged
            Assert.Equal(originalStatusId, user.UserStatusId); // Unchanged
            _mockUserRepository.Verify(
                r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Once);
        }
    }
}
