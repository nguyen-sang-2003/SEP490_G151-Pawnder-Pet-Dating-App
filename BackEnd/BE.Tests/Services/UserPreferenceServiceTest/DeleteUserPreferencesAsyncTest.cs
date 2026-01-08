using BE.Models;
using BE.DTO;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.UserPreferenceServiceTest
{
    public class DeleteUserPreferencesAsyncTest : IDisposable
    {
        private readonly Mock<IUserPreferenceRepository> _mockUserPreferenceRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly UserPreferenceService _userPreferenceService;

        public DeleteUserPreferencesAsyncTest()
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
        /// UTCID01: Normal case - UserId > 0, preferences exist
        /// Condition: UserId > 0, repository returns list of preferences
        /// Expected: Returns true, GetUserPreferencesByUserIdAsync and DeleteRangeAsync called
        /// </summary>
        [Fact]
        public async Task UTCID01_DeleteUserPreferencesAsync_UserIdValidWithPreferences_ReturnsTrue()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = new CancellationToken();

            var existingPreferences = new List<UserPreference>
            {
                new UserPreference
                {
                    UserId = userId,
                    AttributeId = 1,
                    OptionId = 1,
                    CreatedAt = DateTime.Now
                },
                new UserPreference
                {
                    UserId = userId,
                    AttributeId = 2,
                    MinValue = 10,
                    MaxValue = 50,
                    CreatedAt = DateTime.Now
                }
            };

            _mockUserPreferenceRepository
                .Setup(r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(existingPreferences);

            _mockUserPreferenceRepository
                .Setup(r => r.DeleteRangeAsync(existingPreferences, cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userPreferenceService.DeleteUserPreferencesAsync(userId, cancellationToken);

            // Assert
            Assert.True(result);

            // Verify repository interaction
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserPreferenceRepository.Verify(
                r => r.DeleteRangeAsync(existingPreferences, cancellationToken),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Edge case - UserId = 0, no preferences
        /// Condition: UserId = 0, repository returns empty list
        /// Expected: Returns false, DeleteRangeAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID02_DeleteUserPreferencesAsync_UserIdZero_ReturnsFalse()
        {
            // Arrange
            int userId = 0;
            var cancellationToken = new CancellationToken();

            var emptyPreferences = new List<UserPreference>();

            _mockUserPreferenceRepository
                .Setup(r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(emptyPreferences);

            // Act
            var result = await _userPreferenceService.DeleteUserPreferencesAsync(userId, cancellationToken);

            // Assert
            Assert.False(result);

            // Verify repository interaction
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserPreferenceRepository.Verify(
                r => r.DeleteRangeAsync(It.IsAny<IEnumerable<UserPreference>>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Edge case - UserId < 0
        /// Condition: UserId negative, repository returns null/empty
        /// Expected: Returns false, DeleteRangeAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID03_DeleteUserPreferencesAsync_UserIdNegative_ReturnsFalse()
        {
            // Arrange
            int userId = -1;
            var cancellationToken = new CancellationToken();

            _mockUserPreferenceRepository
                .Setup(r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync((IEnumerable<UserPreference>?)null);

            // Act
            var result = await _userPreferenceService.DeleteUserPreferencesAsync(userId, cancellationToken);

            // Assert
            Assert.False(result);

            // Verify repository interaction
            _mockUserPreferenceRepository.Verify(
                r => r.GetUserPreferencesByUserIdAsync(userId, cancellationToken),
                Times.Once);
            _mockUserPreferenceRepository.Verify(
                r => r.DeleteRangeAsync(It.IsAny<IEnumerable<UserPreference>>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        #endregion
    }
}
