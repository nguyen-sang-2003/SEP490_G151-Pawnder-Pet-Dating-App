using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserServiceTest
{
    public class GetUsersAsyncTest
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<PasswordService> _mockPasswordService;
        private readonly UserService _userService;

        public GetUsersAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockUserRepository = new Mock<IUserRepository>();
            _mockPasswordService = new Mock<PasswordService>();

            // Khởi tạo service
            _userService = new UserService(
                _mockUserRepository.Object,
                _mockPasswordService.Object
            );
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Page input valid
        /// Condition: page > 0, pageSize within 1-200, repository returns PagedResult
        /// Expected: Return PagedResult<UserResponse>, repository called with correct parameters
        /// </summary>
        [Fact]
        public async Task UTCID01_GetUsersAsync_ValidPageInput_ReturnsPagedResult()
        {
            // Arrange
            string? search = "test";
            int? roleId = 3;
            int? statusId = 1;
            int page = 2;
            int pageSize = 10;
            bool includeDeleted = false;
            var cancellationToken = new CancellationToken();

            var expectedItems = new List<UserResponse>
            {
                new UserResponse
                {
                    UserId = 1,
                    FullName = "User 1",
                    Email = "user1@example.com"
                },
                new UserResponse
                {
                    UserId = 2,
                    FullName = "User 2",
                    Email = "user2@example.com"
                }
            };
            var expectedResult = new PagedResult<UserResponse>(expectedItems, 100, page, pageSize);

            _mockUserRepository
                .Setup(r => r.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _userService.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedItems.Count, result.Items.Count);
            Assert.Equal(expectedResult.Total, result.Total);
            Assert.Equal(expectedResult.Page, result.Page);
            Assert.Equal(expectedResult.PageSize, result.PageSize);

            // Verify repository interaction
            _mockUserRepository.Verify(
                r => r.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Edge case - Page normalized to 1
        /// Condition: page <= 0 (invalid), should be normalized to 1
        /// Expected: Return PagedResult<UserResponse>, repository called with page = 1
        /// </summary>
        [Fact]
        public async Task UTCID02_GetUsersAsync_PageNormalizedTo1_ReturnsPagedResult()
        {
            // Arrange
            string? search = null;
            int? roleId = null;
            int? statusId = null;
            int page = 0; // Invalid page, should be normalized to 1
            int pageSize = 20;
            bool includeDeleted = false;
            var cancellationToken = new CancellationToken();

            var expectedItems = new List<UserResponse>
            {
                new UserResponse
                {
                    UserId = 1,
                    FullName = "User 1",
                    Email = "user1@example.com"
                }
            };
            var expectedResult = new PagedResult<UserResponse>(expectedItems, 50, 1, pageSize);

            _mockUserRepository
                .Setup(r => r.GetUsersAsync(search, roleId, statusId, 1, pageSize, includeDeleted, cancellationToken))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _userService.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedItems.Count, result.Items.Count);

            // Verify repository interaction - page should be normalized to 1
            _mockUserRepository.Verify(
                r => r.GetUsersAsync(search, roleId, statusId, 1, pageSize, includeDeleted, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID03: Normal case - PageSize within valid range (1-200)
        /// Condition: pageSize within 1-200, should pass as is
        /// Expected: Return PagedResult<UserResponse>, repository called with original pageSize
        /// </summary>
        [Fact]
        public async Task UTCID03_GetUsersAsync_PageSizeWithinValidRange_ReturnsPagedResult()
        {
            // Arrange
            string? search = null;
            int? roleId = null;
            int? statusId = null;
            int page = 1;
            int pageSize = 100; // Valid pageSize within range
            bool includeDeleted = false;
            var cancellationToken = new CancellationToken();

            var expectedItems = new List<UserResponse>
            {
                new UserResponse
                {
                    UserId = 1,
                    FullName = "User 1",
                    Email = "user1@example.com"
                }
            };
            var expectedResult = new PagedResult<UserResponse>(expectedItems, 200, page, pageSize);

            _mockUserRepository
                .Setup(r => r.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _userService.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedResult.PageSize, result.PageSize);

            // Verify repository interaction - pageSize should remain as is
            _mockUserRepository.Verify(
                r => r.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID04: Edge case - PageSize normalized to 20
        /// Condition: pageSize <= 0 or pageSize > 200 (invalid), should be normalized to 20
        /// Expected: Return PagedResult<UserResponse>, repository called with pageSize = 20
        /// </summary>
        [Fact]
        public async Task UTCID04_GetUsersAsync_PageSizeNormalizedTo20_ReturnsPagedResult()
        {
            // Arrange
            string? search = null;
            int? roleId = null;
            int? statusId = null;
            int page = 1;
            int pageSize = 500; // Invalid pageSize > 200, should be normalized to 20
            bool includeDeleted = false;
            var cancellationToken = new CancellationToken();

            var expectedItems = new List<UserResponse>
            {
                new UserResponse
                {
                    UserId = 1,
                    FullName = "User 1",
                    Email = "user1@example.com"
                }
            };
            var expectedResult = new PagedResult<UserResponse>(expectedItems, 50, page, 20);

            _mockUserRepository
                .Setup(r => r.GetUsersAsync(search, roleId, statusId, page, 20, includeDeleted, cancellationToken))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _userService.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken);

            // Assert
            Assert.NotNull(result);

            // Verify repository interaction - pageSize should be normalized to 20
            _mockUserRepository.Verify(
                r => r.GetUsersAsync(search, roleId, statusId, page, 20, includeDeleted, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID05: Normal case - IncludeDeleted = true
        /// Condition: includeDeleted = true, should forward to repository
        /// Expected: Return PagedResult<UserResponse>, repository called with includeDeleted = true
        /// </summary>
        [Fact]
        public async Task UTCID05_GetUsersAsync_IncludeDeletedTrue_ReturnsPagedResult()
        {
            // Arrange
            string? search = null;
            int? roleId = null;
            int? statusId = null;
            int page = 1;
            int pageSize = 20;
            bool includeDeleted = true;
            var cancellationToken = new CancellationToken();

            var expectedItems = new List<UserResponse>
            {
                new UserResponse
                {
                    UserId = 1,
                    FullName = "User 1",
                    Email = "user1@example.com",
                    IsDeleted = false
                },
                new UserResponse
                {
                    UserId = 2,
                    FullName = "Deleted User",
                    Email = "deleted@example.com",
                    IsDeleted = true
                }
            };
            var expectedResult = new PagedResult<UserResponse>(expectedItems, 2, page, pageSize);

            _mockUserRepository
                .Setup(r => r.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _userService.GetUsersAsync(search, roleId, statusId, page, pageSize, includeDeleted, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Items.Count);
            Assert.Contains(result.Items, u => u.IsDeleted == true);

            // Verify repository interaction - includeDeleted should be true
            _mockUserRepository.Verify(
                r => r.GetUsersAsync(search, roleId, statusId, page, pageSize, true, cancellationToken),
                Times.Once);
        }

        #endregion
    }
}
