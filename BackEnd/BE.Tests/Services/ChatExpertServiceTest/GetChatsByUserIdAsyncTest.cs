using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatExpertServiceTest
{
    public class GetChatsByUserIdAsyncTest : IDisposable
    {
        private readonly Mock<IChatExpertRepository> _mockChatExpertRepo;
        private readonly PawnderDatabaseContext _context;
        private readonly ChatExpertService _service;

        public GetChatsByUserIdAsyncTest()
        {
            _mockChatExpertRepo = new Mock<IChatExpertRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatExpertGetChatsByUserDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new ChatExpertService(_mockChatExpertRepo.Object, _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId)
        {
            _context.Users.Add(new User
            {
                UserId = userId,
                Email = $"user{userId}@test.com",
                PasswordHash = "hash",
                UserStatusId = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            _context.SaveChanges();
        }

        /// <summary>
        /// UTCID01: User exists and has chats -> returns list of chat objects with expected properties.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetChatsByUserIdAsync_UserExistsWithChats_ReturnsChatList()
        {
            const int userId = 1;
            SeedUser(userId);

            var now = DateTime.UtcNow;
            var chats = new List<object>
            {
                new
                {
                    chatExpertId = 10,
                    expertId = 100,
                    expertName = "Expert A",
                    lastMessage = "Hello",
                    time = now
                }
            };

            _mockChatExpertRepo
                .Setup(r => r.GetChatsByUserIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(chats);

            var result = await _service.GetChatsByUserIdAsync(userId);
            var list = result.ToList();

            Assert.Single(list);

            var item = list.First();
            var type = item.GetType();

            Assert.Equal(10, (int)type.GetProperty("chatExpertId")!.GetValue(item)!);
            Assert.Equal(100, (int)type.GetProperty("expertId")!.GetValue(item)!);
            Assert.Equal("Expert A", (string?)type.GetProperty("expertName")!.GetValue(item));
            Assert.Equal("Hello", (string?)type.GetProperty("lastMessage")!.GetValue(item));
            Assert.Equal(now, (DateTime)type.GetProperty("time")!.GetValue(item)!);
        }

        /// <summary>
        /// UTCID02: User exists but has no chats -> returns empty list.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetChatsByUserIdAsync_UserExistsNoChats_ReturnsEmptyList()
        {
            const int userId = 2;
            SeedUser(userId);

            var chats = new List<object>();
            _mockChatExpertRepo
                .Setup(r => r.GetChatsByUserIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(chats);

            var result = await _service.GetChatsByUserIdAsync(userId);

            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: User does not exist or invalid userId (0, -1, int.MaxValue) -> throws KeyNotFoundException.
        /// Counted as a single test in report.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetChatsByUserIdAsync_UserNotFoundOrInvalid_ThrowsKeyNotFound()
        {
            var invalidUserIds = new[] { 999, 0, -1, int.MaxValue };

            foreach (var userId in invalidUserIds)
            {
                await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.GetChatsByUserIdAsync(userId));
            }
        }

        /// <summary>
        /// UTCID04: User exists but repository throws -> exception is propagated.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetChatsByUserIdAsync_RepositoryThrows_PropagatesException()
        {
            const int userId = 3;
            SeedUser(userId);

            _mockChatExpertRepo
                .Setup(r => r.GetChatsByUserIdAsync(userId, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("DB error"));

            await Assert.ThrowsAsync<Exception>(
                () => _service.GetChatsByUserIdAsync(userId));
        }
    }
}


