using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ExpertConfirmationServiceTest
{
    public class GetUserExpertConfirmationsAsyncTest : IDisposable
    {
        private readonly Mock<IExpertConfirmationRepository> _mockExpertConfirmationRepo;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly ExpertConfirmationService _service;

        public GetUserExpertConfirmationsAsyncTest()
        {
            _mockExpertConfirmationRepo = new Mock<IExpertConfirmationRepository>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ExpertConfirmationGetUserDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Create DailyLimitService
            var limitServiceOptions = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"DailyLimitDb_{Guid.NewGuid()}")
                .Options;
            var limitContext = new PawnderDatabaseContext(limitServiceOptions);
            var dailyLimitService = new DailyLimitService(limitContext);

            _service = new ExpertConfirmationService(
                _mockExpertConfirmationRepo.Object,
                _context,
                dailyLimitService,
                _mockNotificationService.Object,
                _mockHubContext.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId, string email)
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = email,
                    PasswordHash = "hash",
                    UserStatusId = 2,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: userId=1 (valid, exists), UserExists=TRUE, HasConfirmations=TRUE
        /// -> Trả về IEnumerable<ExpertConfirmationDTO> (not empty) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetUserExpertConfirmationsAsync_ValidUserWithConfirmations_ReturnsNonEmptyList()
        {
            // Arrange
            const int userId = 1;
            SeedUser(userId, "user1@test.com");

            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var mockConfirmations = new List<ExpertConfirmationDTO>
            {
                new ExpertConfirmationDTO
                {
                    UserId = userId,
                    ChatAiId = 10,
                    ExpertId = 2,
                    Status = "pending",
                    Message = "Test message",
                    UserQuestion = "Test question",
                    CreatedAt = now,
                    UpdatedAt = now
                }
            };

            _mockExpertConfirmationRepo
                .Setup(r => r.GetUserExpertConfirmationsAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockConfirmations);

            // Act
            var result = await _service.GetUserExpertConfirmationsAsync(userId);

            // Assert
            var resultList = result.ToList();
            Assert.NotEmpty(resultList);
            Assert.Single(resultList);

            var firstConfirmation = resultList[0];

            // Verify response properties
            Assert.Equal(userId, firstConfirmation.UserId);
            Assert.True(firstConfirmation.ChatAiId > 0);
            Assert.True(firstConfirmation.ExpertId > 0);
            // Nullable properties
            Assert.Equal("pending", firstConfirmation.Status);
            Assert.Equal("Test message", firstConfirmation.Message);
            Assert.Equal("Test question", firstConfirmation.UserQuestion);
            Assert.NotNull(firstConfirmation.CreatedAt);
            Assert.NotNull(firstConfirmation.UpdatedAt);
        }

        /// <summary>
        /// UTCID02: userId=1 (valid, exists), UserExists=TRUE, HasConfirmations=FALSE
        /// -> Trả về IEnumerable<ExpertConfirmationDTO> (empty).
        /// </summary>
        [Fact]
        public async Task UTCID02_GetUserExpertConfirmationsAsync_ValidUserNoConfirmations_ReturnsEmptyList()
        {
            // Arrange
            const int userId = 1;
            SeedUser(userId, "user1@test.com");

            _mockExpertConfirmationRepo
                .Setup(r => r.GetUserExpertConfirmationsAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<ExpertConfirmationDTO>());

            // Act
            var result = await _service.GetUserExpertConfirmationsAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: userId=999 (valid, not exists), UserExists=FALSE
        /// -> Ném KeyNotFoundException với message "Người dùng không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID03_GetUserExpertConfirmationsAsync_UserNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int userId = 999;
            // User not seeded

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetUserExpertConfirmationsAsync(userId));

            Assert.Equal("Người dùng không tồn tại.", ex.Message);

            // Verify repository was NOT called
            _mockExpertConfirmationRepo.Verify(
                r => r.GetUserExpertConfirmationsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: userId invalid (0, -1, int.MaxValue, int.MinValue), UserExists=FALSE
        /// -> Ném KeyNotFoundException với message "Người dùng không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID04_GetUserExpertConfirmationsAsync_InvalidUserId_ThrowsKeyNotFoundException()
        {
            // Arrange
            var invalidUserIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var userId in invalidUserIds)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.GetUserExpertConfirmationsAsync(userId));

                Assert.Equal("Người dùng không tồn tại.", ex.Message);
            }
        }
    }
}
