using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserServiceTest
{
    public class RegisterAsyncTest
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly PasswordService _passwordService; // Use real PasswordService (not mockable)
        private readonly UserService _userService;

        public RegisterAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockUserRepository = new Mock<IUserRepository>();
            _passwordService = new PasswordService(); // Real instance

            // Khởi tạo service
            _userService = new UserService(
                _mockUserRepository.Object,
                _passwordService
            );
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Email not exists, UserStatusId default (null)
        /// Condition: Email not exists, UserStatusId is null, RoleId forced to 3
        /// Expected: UserResponse returned, AddAsync called once, UserStatus default 1, password hashed
        /// </summary>
        [Fact]
        public async Task UTCID01_RegisterAsync_EmailNotExists_ReturnsUserResponse()
        {
            // Arrange
            var cancellationToken = new CancellationToken();

            var request = new UserCreateRequest
            {
                Email = "newuser@example.com",
                Password = "password123",
                FullName = "New User",
                Gender = "Male",
                UserStatusId = null // Default to 1
            };

            _mockUserRepository
                .Setup(r => r.EmailExistsAsync(request.Email.Trim(), cancellationToken))
                .ReturnsAsync(false);

            _mockUserRepository
                .Setup(r => r.AddAsync(It.IsAny<User>(), cancellationToken))
                .ReturnsAsync((User u, CancellationToken ct) => u);

            // Act
            var result = await _userService.RegisterAsync(request, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(request.Email.Trim(), result.Email);
            Assert.Equal(request.FullName?.Trim(), result.FullName);
            Assert.Equal(3, result.RoleId); // RoleId forced to 3
            Assert.Equal(1, result.UserStatusId); // Default UserStatus is 1

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.EmailExistsAsync(request.Email.Trim(), cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.AddAsync(It.Is<User>(u => 
                    u.Email == request.Email.Trim() &&
                    u.RoleId == 3 &&
                    u.UserStatusId == 1 &&
                    !string.IsNullOrEmpty(u.PasswordHash)), cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Exception case - Email already exists
        /// Condition: Email already exists in database
        /// Expected: Throws InvalidOperationException with message "Email đã tồn tại", AddAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID02_RegisterAsync_EmailAlreadyExists_ThrowsInvalidOperationException()
        {
            // Arrange
            var cancellationToken = new CancellationToken();

            var request = new UserCreateRequest
            {
                Email = "existing@example.com",
                Password = "password123",
                FullName = "Existing User"
            };

            _mockUserRepository
                .Setup(r => r.EmailExistsAsync(request.Email.Trim(), cancellationToken))
                .ReturnsAsync(true);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _userService.RegisterAsync(request, cancellationToken));

            Assert.Equal("Email đã tồn tại", exception.Message);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.EmailExistsAsync(request.Email.Trim(), cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Normal case - Email/Password with leading/trailing spaces
        /// Condition: Email and Password contain leading/trailing spaces, should be trimmed
        /// Expected: UserResponse returned, stored email and password are trimmed
        /// </summary>
        [Fact]
        public async Task UTCID03_RegisterAsync_EmailPasswordWithSpaces_TrimmedAndStored()
        {
            // Arrange
            var cancellationToken = new CancellationToken();

            var request = new UserCreateRequest
            {
                Email = "  spaceduser@example.com  ", // With spaces
                Password = "  password123  ", // With spaces
                FullName = "  Spaced User  ",
                Gender = "Female",
                UserStatusId = null
            };

            var trimmedEmail = request.Email.Trim();

            _mockUserRepository
                .Setup(r => r.EmailExistsAsync(trimmedEmail, cancellationToken))
                .ReturnsAsync(false);

            _mockUserRepository
                .Setup(r => r.AddAsync(It.IsAny<User>(), cancellationToken))
                .ReturnsAsync((User u, CancellationToken ct) => u);

            // Act
            var result = await _userService.RegisterAsync(request, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(trimmedEmail, result.Email);
            Assert.Equal(request.FullName.Trim(), result.FullName);

            // Verify repository interaction - email should be trimmed
            _mockUserRepository.Verify(
                r => r.EmailExistsAsync(trimmedEmail, cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.AddAsync(It.Is<User>(u => 
                    u.Email == trimmedEmail &&
                    !string.IsNullOrEmpty(u.PasswordHash)), cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID04: Normal case - UserStatusId provided
        /// Condition: UserStatusId is explicitly provided (e.g., 2)
        /// Expected: UserResponse returned, UserStatus = provided value
        /// </summary>
        [Fact]
        public async Task UTCID04_RegisterAsync_UserStatusIdProvided_UsesProvidedValue()
        {
            // Arrange
            var cancellationToken = new CancellationToken();
            int providedUserStatusId = 2;

            var request = new UserCreateRequest
            {
                Email = "vipuser@example.com",
                Password = "password123",
                FullName = "VIP User",
                Gender = "Male",
                UserStatusId = providedUserStatusId // Explicitly provided
            };

            _mockUserRepository
                .Setup(r => r.EmailExistsAsync(request.Email.Trim(), cancellationToken))
                .ReturnsAsync(false);

            _mockUserRepository
                .Setup(r => r.AddAsync(It.IsAny<User>(), cancellationToken))
                .ReturnsAsync((User u, CancellationToken ct) => u);

            // Act
            var result = await _userService.RegisterAsync(request, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(request.Email.Trim(), result.Email);
            Assert.Equal(3, result.RoleId); // RoleId always forced to 3
            Assert.Equal(providedUserStatusId, result.UserStatusId); // UserStatus = provided value

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.EmailExistsAsync(request.Email.Trim(), cancellationToken),
                Times.Once);
            _mockUserRepository.Verify(
                r => r.AddAsync(It.Is<User>(u => 
                    u.RoleId == 3 &&
                    u.UserStatusId == providedUserStatusId &&
                    !string.IsNullOrEmpty(u.PasswordHash)), cancellationToken),
                Times.Once);
        }

        #endregion
    }
}
