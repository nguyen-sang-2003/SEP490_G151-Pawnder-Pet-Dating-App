using BE.Models;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatAIServiceTest
{
    public class GetTokenUsageAsyncTest : IDisposable
    {
        private readonly Mock<IGeminiAIService> _mockGemini;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;
        private readonly ChatAIService _service;

        public GetTokenUsageAsyncTest()
        {
            _mockGemini = new Mock<IGeminiAIService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatAITokenDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _dailyLimitService = new DailyLimitService(_context);
            _service = new ChatAIService(_mockGemini.Object, _context, _dailyLimitService);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId, int statusId)
        {
            _context.Users.Add(new User
            {
                UserId = userId,
                Email = $"user{userId}@test.com",
                PasswordHash = "hash",
                UserStatusId = statusId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            _context.SaveChanges();
        }

        private void SeedDailyTokens(int userId, int tokens)
        {
            _context.DailyLimits.Add(new DailyLimit
            {
                UserId = userId,
                ActionType = "ai_chat_question",
                ActionDate = DateOnly.FromDateTime(DateTime.Now),
                Count = tokens,
                CreatedAt = DateTime.UtcNow
            });
            _context.SaveChanges();
        }

        /// <summary>
        /// UTCID01: User exists (Free), tokensUsed >= 0 -> returns usage with correct quota.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetTokenUsageAsync_FreeUser_ReturnsUsage()
        {
            const int userId = 1;
            SeedUser(userId, statusId: 2); // not VIP
            SeedDailyTokens(userId, tokens: 150);

            var result = await _service.GetTokenUsageAsync(userId);

            var type = result.GetType();
            Assert.False((bool)type.GetProperty("isVip")!.GetValue(result)!);
            Assert.Equal(10000, (int)type.GetProperty("dailyQuota")!.GetValue(result)!);
            Assert.Equal(150, (int)type.GetProperty("tokensUsed")!.GetValue(result)!);
            Assert.Equal(9850, (int)type.GetProperty("tokensRemaining")!.GetValue(result)!);
        }

        /// <summary>
        /// UTCID02: User not found -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetTokenUsageAsync_UserNotFound_ThrowsKeyNotFound()
        {
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GetTokenUsageAsync(999));
        }

        /// <summary>
        /// UTCID03: Invalid userId (0) -> throws KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetTokenUsageAsync_InvalidUserId_ThrowsKeyNotFound()
        {
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GetTokenUsageAsync(0));
        }

        /// <summary>
        /// UTCID04: VIP user (UserStatusId=3), tokensUsed default 0 -> returns VIP quota.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetTokenUsageAsync_VipUser_ReturnsVipQuota()
        {
            const int userId = 2;
            SeedUser(userId, statusId: 3); // VIP
            // No daily record -> tokensUsed = 0

            var result = await _service.GetTokenUsageAsync(userId);

            var type = result.GetType();
            Assert.True((bool)type.GetProperty("isVip")!.GetValue(result)!);
            Assert.Equal(50000, (int)type.GetProperty("dailyQuota")!.GetValue(result)!);
            Assert.Equal(0, (int)type.GetProperty("tokensUsed")!.GetValue(result)!);
            Assert.Equal(50000, (int)type.GetProperty("tokensRemaining")!.GetValue(result)!);
        }
    }
}

