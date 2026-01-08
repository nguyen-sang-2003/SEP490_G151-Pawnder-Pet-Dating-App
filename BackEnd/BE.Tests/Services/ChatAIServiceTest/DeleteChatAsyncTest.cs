using BE.Models;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatAIServiceTest
{
    public class DeleteChatAsyncTest : IDisposable
    {
        private readonly Mock<IGeminiAIService> _mockGemini;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;
        private readonly ChatAIService _service;

        public DeleteChatAsyncTest()
        {
            _mockGemini = new Mock<IGeminiAIService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatAIDeleteChatDb_{Guid.NewGuid()}")
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
            var now = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(-1), DateTimeKind.Unspecified);

            var chat = new ChatAi
            {
                ChatAiid = chatAiId,
                UserId = userId,
                Title = "Existing chat",
                IsDeleted = isDeleted,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.ChatAis.Add(chat);
            _context.SaveChanges();

            return chat;
        }

        /// <summary>
        /// UTCID01: Valid chatAiId, userId matches, chat not deleted -> returns true and sets IsDeleted = true.
        /// </summary>
        [Fact]
        public async Task UTCID01_DeleteChatAsync_ValidChatAndUser_ReturnsTrueAndSoftDeletes()
        {
            const int chatAiId = 1;
            const int userId = 10;
            SeedChat(chatAiId, userId);

            var result = await _service.DeleteChatAsync(chatAiId, userId);

            Assert.True(result);

            var updatedChat = await _context.ChatAis.FirstAsync(c => c.ChatAiid == chatAiId);
            Assert.True(updatedChat.IsDeleted ?? false);
            Assert.NotNull(updatedChat.UpdatedAt);
        }

        /// <summary>
        /// UTCID02: Chat not found (chatAiId does not exist) -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID02_DeleteChatAsync_ChatNotFound_ThrowsKeyNotFound()
        {
            const int chatAiId = 999;
            const int userId = 10;

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.DeleteChatAsync(chatAiId, userId));
        }

        /// <summary>
        /// UTCID03: Invalid chatAiId values (0, -1, int.MaxValue) -> throws KeyNotFoundException.
        /// Counted as a single test in report.
        /// </summary>
        [Fact]
        public async Task UTCID03_DeleteChatAsync_InvalidChatIds_ThrowKeyNotFound()
        {
            const int userId = 10;
            var invalidChatIds = new[] { 0, -1, int.MaxValue };

            foreach (var invalidChatId in invalidChatIds)
            {
                await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.DeleteChatAsync(invalidChatId, userId));
            }
        }

        /// <summary>
        /// UTCID04: Chat exists but belongs to different user (userId != chat.UserId) -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID04_DeleteChatAsync_ChatBelongsToDifferentUser_ThrowsKeyNotFound()
        {
            const int chatAiId = 2;
            const int ownerUserId = 100;
            const int otherUserId = 200;
            SeedChat(chatAiId, ownerUserId);

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.DeleteChatAsync(chatAiId, otherUserId));
        }
    }
}


