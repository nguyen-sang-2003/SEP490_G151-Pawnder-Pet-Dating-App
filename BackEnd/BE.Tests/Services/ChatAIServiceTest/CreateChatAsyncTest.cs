using BE.Models;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatAIServiceTest
{
    public class CreateChatAsyncTest : IDisposable
    {
        private readonly Mock<IGeminiAIService> _mockGemini;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;
        private readonly ChatAIService _service;

        public CreateChatAsyncTest()
        {
            _mockGemini = new Mock<IGeminiAIService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatAICreateChatDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _dailyLimitService = new DailyLimitService(_context);
            _service = new ChatAIService(_mockGemini.Object, _context, _dailyLimitService);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: Valid userId and non-null title -> returns object with expected properties.
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateChatAsync_ValidUserAndTitle_ReturnsChatObject()
        {
            // Arrange
            const int userId = 1;
            const string title = "My chat title";
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            var chatEntity = new ChatAi
            {
                ChatAiid = 10,
                UserId = userId,
                Title = title,
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };

            _mockGemini
                .Setup(g => g.CreateChatSessionAsync(userId, title))
                .ReturnsAsync(chatEntity);

            // Act
            var result = await _service.CreateChatAsync(userId, title);

            // Assert
            var type = result.GetType();
            Assert.Equal(10, (int)type.GetProperty("chatId")!.GetValue(result)!);
            Assert.Equal(title, (string?)type.GetProperty("title")!.GetValue(result));
            Assert.Equal(now, (DateTime?)type.GetProperty("createdAt")!.GetValue(result));
        }

        /// <summary>
        /// UTCID02: Valid userId and null title -> uses default title and returns object.
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateChatAsync_ValidUserAndNullTitle_UsesDefaultTitle()
        {
            // Arrange
            const int userId = 2;
            string? title = null;
            const string expectedTitle = "New Chat";
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            var chatEntity = new ChatAi
            {
                ChatAiid = 20,
                UserId = userId,
                Title = expectedTitle,
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };

            _mockGemini
                .Setup(g => g.CreateChatSessionAsync(userId, expectedTitle))
                .ReturnsAsync(chatEntity);

            // Act
            var result = await _service.CreateChatAsync(userId, title);

            // Assert
            var type = result.GetType();
            Assert.Equal(20, (int)type.GetProperty("chatId")!.GetValue(result)!);
            Assert.Equal(expectedTitle, (string?)type.GetProperty("title")!.GetValue(result));
            Assert.Equal(now, (DateTime?)type.GetProperty("createdAt")!.GetValue(result));
        }

        /// <summary>
        /// UTCID03: UserId does not exist -> underlying save fails and DbUpdateException is thrown.
        /// (Simulated via mocked IGeminiAIService.)
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateChatAsync_UserNotExists_ThrowsDbUpdateException()
        {
            // Arrange
            const int userId = 999;
            const string title = "Any title";

            _mockGemini
                .Setup(g => g.CreateChatSessionAsync(userId, It.IsAny<string>()))
                .ThrowsAsync(new DbUpdateException("User not found"));

            // Act & Assert
            await Assert.ThrowsAsync<DbUpdateException>(() => _service.CreateChatAsync(userId, title));
        }

        /// <summary>
        /// UTCID04: Invalid userId (0, -1, int.MaxValue) -> DbUpdateException is thrown.
        /// (Simulated via mocked IGeminiAIService.) This is counted as a single test.
        /// </summary>
        [Fact]
        public async Task UTCID04_CreateChatAsync_InvalidUserIds_ThrowsDbUpdateException()
        {
            const string title = "Invalid user chat";
            var invalidUserIds = new[] { 0, -1, int.MaxValue };

            foreach (var invalidUserId in invalidUserIds)
            {
                _mockGemini
                    .Setup(g => g.CreateChatSessionAsync(invalidUserId, It.IsAny<string>()))
                    .ThrowsAsync(new DbUpdateException("Invalid user id"));

                await Assert.ThrowsAsync<DbUpdateException>(() => _service.CreateChatAsync(invalidUserId, title));
            }
        }
    }
}


