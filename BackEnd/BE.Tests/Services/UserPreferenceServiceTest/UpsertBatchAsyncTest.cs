using BE.Models;
using BE.DTO;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserPreferenceServiceTest
{
    public class UpsertBatchAsyncTest : IDisposable
    {
        private readonly Mock<IUserPreferenceRepository> _mockUserPreferenceRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly UserPreferenceService _userPreferenceService;

        public UpsertBatchAsyncTest()
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
        /// UTCID01: Edge case - userPreferences is null
        /// Condition: Request has null Preferences, user exists
        /// Expected: Returns result object, DeleteRangeAsync called if existing preferences
        /// </summary>
        [Fact]
        public async Task UTCID01_UpsertBatchAsync_PreferencesNull_DeletesExistingAndReturns()
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

            var request = new UserPreferenceBatchUpsertRequest
            {
                Preferences = null // Null preferences
            };

            var existingPreferences = new List<UserPreference>();

            _mockUserPreferenceRepository
                .Setup(r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingPreferences);

            // Act
            var result = await _userPreferenceService.UpsertBatchAsync(userId, request, cancellationToken);

            // Assert
            Assert.NotNull(result);

            // Verify repository interaction
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Edge case - userPreferences is empty
        /// Condition: Request has empty Preferences list, user exists
        /// Expected: Returns result object, DeleteRangeAsync called if existing preferences
        /// </summary>
        [Fact]
        public async Task UTCID02_UpsertBatchAsync_PreferencesEmpty_DeletesExistingAndReturns()
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

            var request = new UserPreferenceBatchUpsertRequest
            {
                Preferences = new List<UserPreferenceBatchRequest>() // Empty list
            };

            var existingPreferences = new List<UserPreference>
            {
                new UserPreference { UserId = userId, AttributeId = 1, CreatedAt = DateTime.Now }
            };

            _mockUserPreferenceRepository
                .Setup(r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingPreferences);

            _mockUserPreferenceRepository
                .Setup(r => r.DeleteRangeAsync(existingPreferences, cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userPreferenceService.UpsertBatchAsync(userId, request, cancellationToken);

            // Assert
            Assert.NotNull(result);

            // Verify repository interaction - DeleteRangeAsync called because existing prefs
            _mockUserPreferenceRepository.Verify(
                r => r.DeleteRangeAsync(existingPreferences, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID03: Normal case - Valid preferences, UserId > 0
        /// Condition: Request has valid Preferences, user exists, attributes exist
        /// Expected: Returns result object, AddAsync/UpdateAsync called for each preference
        /// </summary>
        [Fact]
        public async Task UTCID03_UpsertBatchAsync_ValidPreferences_UpsertsAndReturns()
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

            // Setup attributes in database
            var attribute1 = new BE.Models.Attribute
            {
                AttributeId = 1,
                Name = "Color",
                TypeValue = "select",
                IsDeleted = false
            };
            var attribute2 = new BE.Models.Attribute
            {
                AttributeId = 2,
                Name = "Size",
                TypeValue = "range",
                IsDeleted = false
            };
            _context.Attributes.Add(attribute1);
            _context.Attributes.Add(attribute2);
            await _context.SaveChangesAsync();

            var request = new UserPreferenceBatchUpsertRequest
            {
                Preferences = new List<UserPreferenceBatchRequest>
                {
                    new UserPreferenceBatchRequest { AttributeId = 1, OptionId = 1 },
                    new UserPreferenceBatchRequest { AttributeId = 2, MinValue = 10, MaxValue = 50 }
                }
            };

            // Existing preference for attribute 1 (will be updated)
            var existingPreferences = new List<UserPreference>
            {
                new UserPreference
                {
                    UserId = userId,
                    AttributeId = 1,
                    OptionId = 2,
                    CreatedAt = DateTime.Now.AddDays(-1)
                }
            };

            _mockUserPreferenceRepository
                .Setup(r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingPreferences);

            _mockUserPreferenceRepository
                .Setup(r => r.UpdateAsync(It.IsAny<UserPreference>(), cancellationToken))
                .Returns(Task.CompletedTask);

            _mockUserPreferenceRepository
                .Setup(r => r.AddAsync(It.IsAny<UserPreference>(), cancellationToken))
                .ReturnsAsync((UserPreference up, CancellationToken ct) => up);

            // Act
            var result = await _userPreferenceService.UpsertBatchAsync(userId, request, cancellationToken);

            // Assert
            Assert.NotNull(result);

            // Verify repository interaction
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserPreferenceRepository.Verify(
                r => r.UpdateAsync(It.IsAny<UserPreference>(), cancellationToken),
                Times.Once); // Update existing attribute 1
            _mockUserPreferenceRepository.Verify(
                r => r.AddAsync(It.IsAny<UserPreference>(), cancellationToken),
                Times.Once); // Add new attribute 2
        }

        /// <summary>
        /// UTCID04: Exception case - UserId <= 0 or user not exists
        /// Condition: User does not exist
        /// Expected: Throws KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID04_UpsertBatchAsync_UserNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            int userId = 999; // Non-existent user
            var cancellationToken = new CancellationToken();

            var request = new UserPreferenceBatchUpsertRequest
            {
                Preferences = new List<UserPreferenceBatchRequest>
                {
                    new UserPreferenceBatchRequest { AttributeId = 1, OptionId = 1 }
                }
            };

            // No user in database

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _userPreferenceService.UpsertBatchAsync(userId, request, cancellationToken));

            Assert.Equal("User không tồn tại.", exception.Message);

            // Verify repository interaction - not called
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesByUserIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        #endregion
    }
}
