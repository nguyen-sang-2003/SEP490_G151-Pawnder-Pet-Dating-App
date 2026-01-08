using BE.Models;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatAIServiceTest
{
    public class UpdateChatTitleAsyncTest : IDisposable
    {
        private readonly Mock<IGeminiAIService> _mockGemini;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;
        private readonly ChatAIService _service;

        public UpdateChatTitleAsyncTest()
        {
            _mockGemini = new Mock<IGeminiAIService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatAIUpdateTitleDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _dailyLimitService = new DailyLimitService(_context);
            _service = new ChatAIService(_mockGemini.Object, _context, _dailyLimitService);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private ChatAi SeedChat(int chatAiId, int userId, bool isDeleted = false)
        {
            var createdAt = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified);
            var updatedAt = createdAt;

            var chat = new ChatAi
            {
                ChatAiid = chatAiId,
                UserId = userId,
                Title = "Old title",
                IsDeleted = isDeleted,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };

            _context.ChatAis.Add(chat);
            _context.SaveChanges();
            return chat;
        }

        /// <summary>
        /// UTCID01: Valid chatAiId, matching userId, not deleted, valid title -> returns true and updates title.
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdateChatTitleAsync_ValidChatAndTitle_ReturnsTrueAndUpdates()
        {
            const int chatAiId = 1;
            const int userId = 10;
            const string newTitle = "New chat title";
            var chat = SeedChat(chatAiId, userId);
            var oldUpdatedAt = chat.UpdatedAt;

            var result = await _service.UpdateChatTitleAsync(chatAiId, userId, newTitle);

            Assert.True(result);

            var updatedChat = await _context.ChatAis.FirstAsync(c => c.ChatAiid == chatAiId);
            Assert.Equal(newTitle, updatedChat.Title);
            Assert.NotNull(updatedChat.UpdatedAt);
            Assert.NotEqual(oldUpdatedAt, updatedChat.UpdatedAt);
        }

        /// <summary>
        /// UTCID02: Chat not found -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdateChatTitleAsync_ChatNotFound_ThrowsKeyNotFound()
        {
            const int chatAiId = 999;
            const int userId = 1;

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdateChatTitleAsync(chatAiId, userId, "New title"));
        }

        /// <summary>
        /// UTCID03: Invalid chatAiId (0, -1, int.MaxValue) -> throws KeyNotFoundException.
        /// Counted as a single test in report.
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdateChatTitleAsync_InvalidChatIds_ThrowKeyNotFound()
        {
            const int userId = 1;
            var invalidChatIds = new[] { 0, -1, int.MaxValue };

            foreach (var invalidChatId in invalidChatIds)
            {
                await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.UpdateChatTitleAsync(invalidChatId, userId, "New title"));
            }
        }

        /// <summary>
        /// UTCID04: Chat exists but belongs to different user -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdateChatTitleAsync_ChatBelongsToDifferentUser_ThrowsKeyNotFound()
        {
            const int chatAiId = 2;
            const int ownerUserId = 100;
            const int otherUserId = 200;
            SeedChat(chatAiId, ownerUserId);

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdateChatTitleAsync(chatAiId, otherUserId, "New title"));
        }

        /// <summary>
        /// UTCID05: Chat exists but IsDeleted = true -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID05_UpdateChatTitleAsync_DeletedChat_ThrowsKeyNotFound()
        {
            const int chatAiId = 3;
            const int userId = 10;
            SeedChat(chatAiId, userId, isDeleted: true);

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdateChatTitleAsync(chatAiId, userId, "New title"));
        }

        /// <summary>
        /// UTCID06: Invalid title (null/empty/whitespace) and invalid userId -> throws ArgumentException.
        /// Title validation happens before DB lookup, so chat and user are not checked.
        /// </summary>
        [Fact]
        public async Task UTCID06_UpdateChatTitleAsync_InvalidTitle_ThrowsArgumentException()
        {
            const int chatAiId = 1;
            const int invalidUserId = 0;

            await Assert.ThrowsAsync<ArgumentException>(
                () => _service.UpdateChatTitleAsync(chatAiId, invalidUserId, " "));
        }
    }
}


