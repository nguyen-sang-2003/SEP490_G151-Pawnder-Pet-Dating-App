using BE.Models;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatAIServiceTest
{
    public class SendMessageAsyncTest : IDisposable
    {
        private readonly Mock<IGeminiAIService> _mockGemini;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;
        private readonly ChatAIService _service;

        public SendMessageAsyncTest()
        {
            _mockGemini = new Mock<IGeminiAIService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatAISendMessageDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _dailyLimitService = new DailyLimitService(_context);
            _service = new ChatAIService(_mockGemini.Object, _context, _dailyLimitService);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId, int userStatusId)
        {
            _context.Users.Add(new User
            {
                UserId = userId,
                Email = $"user{userId}@test.com",
                PasswordHash = "hash",
                UserStatusId = userStatusId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            _context.SaveChanges();
        }

        private static GeminiResponse CreateGeminiResponse(
            string answer = "AI answer",
            int inputTokens = 10,
            int outputTokens = 20)
        {
            return new GeminiResponse
            {
                Answer = answer,
                InputTokens = inputTokens,
                OutputTokens = outputTokens,
                TotalTokens = inputTokens + outputTokens
            };
        }

        /// <summary>
        /// UTCID01: Free user (UserStatusId != 3), valid chatId & userId, valid question -> returns response with correct usage & tokenDetails.
        /// </summary>
        [Fact]
        public async Task UTCID01_SendMessageAsync_FreeUser_ValidInput_ReturnsResponse()
        {
            const int chatAiId = 1;
            const int userId = 10;
            const int userStatusId = 2; // Free user
            const string question = "Hi";

            SeedUser(userId, userStatusId);

            var geminiResponse = CreateGeminiResponse(answer: "Hello", inputTokens: 5, outputTokens: 15);

            _mockGemini
                .Setup(g => g.SendMessageAsync(userId, chatAiId, question))
                .ReturnsAsync(geminiResponse);

            var result = await _service.SendMessageAsync(chatAiId, userId, question);
            var type = result.GetType();

            Assert.Equal(question, (string?)type.GetProperty("question")!.GetValue(result));
            Assert.Equal("Hello", (string?)type.GetProperty("answer")!.GetValue(result));

            var usage = type.GetProperty("usage")!.GetValue(result)!;
            var usageType = usage.GetType();
            Assert.False((bool)usageType.GetProperty("isVip")!.GetValue(usage)!);
            Assert.Equal(10000, (int)usageType.GetProperty("dailyQuota")!.GetValue(usage)!);
            Assert.True((int)usageType.GetProperty("tokensUsed")!.GetValue(usage)! >= 0);
            Assert.True((int)usageType.GetProperty("tokensRemaining")!.GetValue(usage)! >= 0);

            var tokenDetails = type.GetProperty("tokenDetails")!.GetValue(result)!;
            var tokenType = tokenDetails.GetType();
            Assert.Equal(5, (int)tokenType.GetProperty("inputTokens")!.GetValue(tokenDetails)!);
            Assert.Equal(15, (int)tokenType.GetProperty("outputTokens")!.GetValue(tokenDetails)!);
            Assert.Equal(20, (int)tokenType.GetProperty("totalTokens")!.GetValue(tokenDetails)!);
        }

        /// <summary>
        /// UTCID02: VIP user (UserStatusId = 3), valid chatId & userId, valid question -> returns response with VIP quota.
        /// </summary>
        [Fact]
        public async Task UTCID02_SendMessageAsync_VipUser_ValidInput_ReturnsResponseWithVipQuota()
        {
            const int chatAiId = 2;
            const int userId = 20;
            const int userStatusId = 3; // VIP
            const string question = "Hi";

            SeedUser(userId, userStatusId);

            var geminiResponse = CreateGeminiResponse(answer: "VIP Hello", inputTokens: 10, outputTokens: 10);

            _mockGemini
                .Setup(g => g.SendMessageAsync(userId, chatAiId, question))
                .ReturnsAsync(geminiResponse);

            var result = await _service.SendMessageAsync(chatAiId, userId, question);
            var type = result.GetType();

            Assert.Equal(question, (string?)type.GetProperty("question")!.GetValue(result));
            Assert.Equal("VIP Hello", (string?)type.GetProperty("answer")!.GetValue(result));

            var usage = type.GetProperty("usage")!.GetValue(result)!;
            var usageType = usage.GetType();
            Assert.True((bool)usageType.GetProperty("isVip")!.GetValue(usage)!);
            Assert.Equal(50000, (int)usageType.GetProperty("dailyQuota")!.GetValue(usage)!);

            var tokenDetails = type.GetProperty("tokenDetails")!.GetValue(result)!;
            var tokenType = tokenDetails.GetType();
            Assert.Equal(10, (int)tokenType.GetProperty("inputTokens")!.GetValue(tokenDetails)!);
            Assert.Equal(10, (int)tokenType.GetProperty("outputTokens")!.GetValue(tokenDetails)!);
            Assert.Equal(20, (int)tokenType.GetProperty("totalTokens")!.GetValue(tokenDetails)!);
        }

        /// <summary>
        /// UTCID03: Chat does not exist -> underlying Gemini service throws and exception is propagated.
        /// </summary>
        [Fact]
        public async Task UTCID03_SendMessageAsync_ChatNotFound_ThrowsException()
        {
            const int chatAiId = 999;
            const int userId = 30;
            const int userStatusId = 2;
            const string question = "Hi";

            SeedUser(userId, userStatusId);

            _mockGemini
                .Setup(g => g.SendMessageAsync(userId, chatAiId, question))
                .ThrowsAsync(new Exception("Chat session not found or access denied"));

            await Assert.ThrowsAsync<Exception>(
                () => _service.SendMessageAsync(chatAiId, userId, question));
        }

        /// <summary>
        /// UTCID04: Invalid chatAiId values (0, -1, int.MaxValue) -> Gemini throws and exception is propagated.
        /// Counted as a single test in report.
        /// </summary>
        [Fact]
        public async Task UTCID04_SendMessageAsync_InvalidChatIds_ThrowException()
        {
            const int userId = 40;
            const int userStatusId = 2;
            const string question = "Hi";
            SeedUser(userId, userStatusId);

            var invalidChatIds = new[] { 0, -1, int.MaxValue };

            foreach (var invalidChatId in invalidChatIds)
            {
                _mockGemini
                    .Setup(g => g.SendMessageAsync(userId, invalidChatId, question))
                    .ThrowsAsync(new Exception("Chat session not found or access denied"));

                await Assert.ThrowsAsync<Exception>(
                    () => _service.SendMessageAsync(invalidChatId, userId, question));
            }
        }

        /// <summary>
        /// UTCID05: Chat exists but belongs to different user -> Gemini throws and exception is propagated.
        /// </summary>
        [Fact]
        public async Task UTCID05_SendMessageAsync_ChatBelongsToDifferentUser_ThrowsException()
        {
            const int chatAiId = 5;
            const int ownerUserId = 50;
            const int otherUserId = 60;
            const string question = "Hi";

            SeedUser(otherUserId, userStatusId: 2);

            _mockGemini
                .Setup(g => g.SendMessageAsync(otherUserId, chatAiId, question))
                .ThrowsAsync(new Exception("Chat session not found or access denied"));

            await Assert.ThrowsAsync<Exception>(
                () => _service.SendMessageAsync(chatAiId, otherUserId, question));
        }

        /// <summary>
        /// UTCID06: Chat exists but deleted -> Gemini throws and exception is propagated.
        /// </summary>
        [Fact]
        public async Task UTCID06_SendMessageAsync_DeletedChat_ThrowsException()
        {
            const int chatAiId = 6;
            const int userId = 70;
            const string question = "Hi";

            SeedUser(userId, userStatusId: 2);

            _mockGemini
                .Setup(g => g.SendMessageAsync(userId, chatAiId, question))
                .ThrowsAsync(new Exception("Chat session not found or access denied"));

            await Assert.ThrowsAsync<Exception>(
                () => _service.SendMessageAsync(chatAiId, userId, question));
        }

        /// <summary>
        /// UTCID07: User does not exist -> throws KeyNotFoundException before calling Gemini.
        /// </summary>
        [Fact]
        public async Task UTCID07_SendMessageAsync_UserNotFound_ThrowsKeyNotFound()
        {
            const int chatAiId = 7;
            const int userId = 999; // not seeded
            const string question = "Hi";

            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.SendMessageAsync(chatAiId, userId, question));
        }

        /// <summary>
        /// UTCID08: Invalid question (null/empty/whitespace) -> throws ArgumentException.
        /// </summary>
        [Fact]
        public async Task UTCID08_SendMessageAsync_InvalidQuestion_ThrowsArgumentException()
        {
            const int chatAiId = 8;
            const int userId = 80;

            await Assert.ThrowsAsync<ArgumentException>(
                () => _service.SendMessageAsync(chatAiId, userId, " "));
        }
    }
}


