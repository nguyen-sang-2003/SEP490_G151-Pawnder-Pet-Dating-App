using BE.Models;
using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserPreferenceServiceTest
{
    public class GetUserPreferencesAsyncTest : IDisposable
    {
        private readonly Mock<IUserPreferenceRepository> _mockUserPreferenceRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly UserPreferenceService _userPreferenceService;

        public GetUserPreferencesAsyncTest()
        {
            // Setup InMemory Database
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new PawnderDatabaseContext(options);

            // Setup mocks
            _mockUserPreferenceRepository = new Mock<IUserPreferenceRepository>();

            // Khởi tạo service
            _userPreferenceService = new UserPreferenceService(
                _mockUserPreferenceRepository.Object,
                _context
            );
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - User exists
        /// Condition: User exists and not deleted, repository returns list
        /// Expected: Returns IEnumerable<UserPreferenceResponse>, GetUserPreferencesAsync called once
        /// </summary>
        [Fact]
        public async Task UTCID01_GetUserPreferencesAsync_UserExists_ReturnsUserPreferences()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            // Setup user in database
            var user = new User
            {
                UserId = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                IsDeleted = false
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var expectedPreferences = new List<UserPreferenceResponse>
            {
                new UserPreferenceResponse
                {
                    AttributeId = 1,
                    AttributeName = "Color",
                    TypeValue = "select",
                    OptionId = 1,
                    OptionName = "Black"
                },
                new UserPreferenceResponse
                {
                    AttributeId = 2,
                    AttributeName = "Size",
                    TypeValue = "range",
                    MinValue = 10,
                    MaxValue = 50
                }
            };

            _mockUserPreferenceRepository
                .Setup(r => r.GetUserPreferencesAsync(userId, cancellationToken))
                .ReturnsAsync(expectedPreferences);

            // Act
            var result = await _userPreferenceService.GetUserPreferencesAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());

            // Verify repository interaction
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesAsync(userId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Exception case - User does not exist
        /// Condition: UserId not in database
        /// Expected: Throws KeyNotFoundException, repository not called
        /// </summary>
        [Fact]
        public async Task UTCID02_GetUserPreferencesAsync_UserNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            int userId = 999; // Non-existent user
            var cancellationToken = new CancellationToken();

            // No user in database

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _userPreferenceService.GetUserPreferencesAsync(userId, cancellationToken));

            Assert.Equal("User not found.", exception.Message);

            // Verify repository interaction - not called because user validation failed
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Exception case - User is deleted
        /// Condition: User exists but IsDeleted = true
        /// Expected: Throws KeyNotFoundException, repository not called
        /// </summary>
        [Fact]
        public async Task UTCID03_GetUserPreferencesAsync_UserDeleted_ThrowsKeyNotFoundException()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            // Setup deleted user in database
            var user = new User
            {
                UserId = userId,
                FullName = "Deleted User",
                Email = "deleted@example.com",
                PasswordHash = "hashedpassword",
                IsDeleted = true // User is deleted
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _userPreferenceService.GetUserPreferencesAsync(userId, cancellationToken));

            Assert.Equal("User not found.", exception.Message);

            // Verify repository interaction - not called
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Normal case - User exists with empty preferences
        /// Condition: User exists, repository returns empty list
        /// Expected: Returns empty IEnumerable, GetUserPreferencesAsync called once
        /// </summary>
        [Fact]
        public async Task UTCID04_GetUserPreferencesAsync_UserExistsEmptyPreferences_ReturnsEmptyList()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            // Setup user in database
            var user = new User
            {
                UserId = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                IsDeleted = false
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var emptyPreferences = new List<UserPreferenceResponse>();

            _mockUserPreferenceRepository
                .Setup(r => r.GetUserPreferencesAsync(userId, cancellationToken))
                .ReturnsAsync(emptyPreferences);

            // Act
            var result = await _userPreferenceService.GetUserPreferencesAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);

            // Verify repository interaction
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesAsync(userId, cancellationToken),
                Times.Once);
        }

        #endregion
    }
}
