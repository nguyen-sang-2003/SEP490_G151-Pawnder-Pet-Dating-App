using BE.Models;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatAIServiceTest
{
    public class GetChatHistoryAsyncTest : IDisposable
    {
        private readonly Mock<IGeminiAIService> _mockGemini;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;
        private readonly ChatAIService _service;

        public GetChatHistoryAsyncTest()
        {
            _mockGemini = new Mock<IGeminiAIService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatAIGetHistoryDb_{Guid.NewGuid()}")
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
                Title = "My chat",
                IsDeleted = isDeleted,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.ChatAis.Add(chat);
            _context.SaveChanges();
            return chat;
        }

        private List<ChatAicontent> SampleMessages(int chatAiId)
        {
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            return new List<ChatAicontent>
            {
                new ChatAicontent { ContentId = 1, ChatAiid = chatAiId, Question = "Q1", Answer = "A1", CreatedAt = now },
                new ChatAicontent { ContentId = 2, ChatAiid = chatAiId, Question = "Q2", Answer = "A2", CreatedAt = now }
            };
        }

        /// <summary>
        /// UTCID01: Valid chatAiId, user owns chat, chat not deleted, messages exist -> returns chatTitle and messages.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetChatHistoryAsync_OwnerWithMessages_ReturnsHistory()
        {
            const int chatAiId = 1;
            const int userId = 10;
            var chat = SeedChat(chatAiId, userId);
            var messages = SampleMessages(chatAiId);

            _mockGemini.Setup(g => g.GetChatHistoryAsync(chatAiId)).ReturnsAsync(messages);

            var result = await _service.GetChatHistoryAsync(chatAiId, userId);
            var type = result.GetType();

            Assert.Equal(chat.Title, (string?)type.GetProperty("chatTitle")!.GetValue(result));

            var messagesProp = (IEnumerable<object>?)type.GetProperty("messages")!.GetValue(result);
            Assert.NotNull(messagesProp);
            var list = messagesProp!.ToList();
            Assert.Equal(2, list.Count);

            var first = list.First();
            var firstType = first.GetType();
            Assert.Equal(1, (int)firstType.GetProperty("contentId")!.GetValue(first)!);
            Assert.Equal("Q1", (string?)firstType.GetProperty("question")!.GetValue(first));
            Assert.Equal("A1", (string?)firstType.GetProperty("answer")!.GetValue(first));
            Assert.NotNull((DateTime?)firstType.GetProperty("createdAt")!.GetValue(first));
        }

        /// <summary>
        /// UTCID02: Expert/admin (userId = 0) can view any chat -> returns history.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetChatHistoryAsync_ExpertUser_ReturnsHistory()
        {
            const int chatAiId = 2;
            const int ownerUserId = 20;
            const int expertUserId = 0; // special case: can view any chat
            var chat = SeedChat(chatAiId, ownerUserId);
            var messages = SampleMessages(chatAiId);

            _mockGemini.Setup(g => g.GetChatHistoryAsync(chatAiId)).ReturnsAsync(messages);

            var result = await _service.GetChatHistoryAsync(chatAiId, expertUserId);
            var type = result.GetType();

            Assert.Equal(chat.Title, (string?)type.GetProperty("chatTitle")!.GetValue(result));
            var messagesProp = (IEnumerable<object>?)type.GetProperty("messages")!.GetValue(result);
            Assert.NotNull(messagesProp);
            Assert.Equal(2, messagesProp!.Count());
        }

        /// <summary>
        /// UTCID03: Chat not found -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetChatHistoryAsync_ChatNotFound_ThrowsKeyNotFound()
        {
            const int chatAiId = 999;
            const int userId = 10;

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetChatHistoryAsync(chatAiId, userId));
        }

        /// <summary>
        /// UTCID04: Invalid chatAiId values (0, -1, int.MaxValue) -> throws KeyNotFoundException.
        /// Counted as a single test in report.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetChatHistoryAsync_InvalidChatIds_ThrowKeyNotFound()
        {
            const int userId = 10;
            var invalidChatIds = new[] { 0, -1, int.MaxValue };

            foreach (var invalidChatId in invalidChatIds)
            {
                await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.GetChatHistoryAsync(invalidChatId, userId));
            }
        }

        /// <summary>
        /// UTCID05: Chat exists but belongs to different user (and caller is not expert) -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID05_GetChatHistoryAsync_ChatBelongsToDifferentUser_ThrowsKeyNotFound()
        {
            const int chatAiId = 3;
            const int ownerUserId = 30;
            const int otherUserId = 40;
            SeedChat(chatAiId, ownerUserId);

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetChatHistoryAsync(chatAiId, otherUserId));
        }

        /// <summary>
        /// UTCID06: Chat exists but IsDeleted = true -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID06_GetChatHistoryAsync_DeletedChat_ThrowsKeyNotFound()
        {
            const int chatAiId = 4;
            const int userId = 50;
            SeedChat(chatAiId, userId, isDeleted: true);

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetChatHistoryAsync(chatAiId, userId));
        }
    }
}


