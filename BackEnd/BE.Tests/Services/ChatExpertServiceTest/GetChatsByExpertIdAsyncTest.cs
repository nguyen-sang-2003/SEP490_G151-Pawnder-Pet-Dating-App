using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatExpertServiceTest
{
    public class GetChatsByExpertIdAsyncTest : IDisposable
    {
        private readonly Mock<IChatExpertRepository> _mockChatExpertRepo;
        private readonly PawnderDatabaseContext _context;
        private readonly ChatExpertService _service;

        public GetChatsByExpertIdAsyncTest()
        {
            _mockChatExpertRepo = new Mock<IChatExpertRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatExpertGetChatsByExpertDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new ChatExpertService(_mockChatExpertRepo.Object, _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedExpert(int expertId, string name = "Expert Name")
        {
            _context.Users.Add(new User
            {
                UserId = expertId,
                Email = $"expert{expertId}@test.com",
                PasswordHash = "hash",
                UserStatusId = 3, // mark as VIP/expert for test purposes
                FullName = name,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            _context.SaveChanges();
        }

        /// <summary>
        /// UTCID01: Expert exists and has chats -> returns non-empty list with expected properties.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetChatsByExpertIdAsync_ExpertExistsWithChats_ReturnsList()
        {
            const int expertId = 1;
            SeedExpert(expertId, "Expert A");

            var now = DateTime.UtcNow;
            var chats = new List<object>
            {
                new
                {
                    chatExpertId = 10,
                    expertId = expertId,
                    expertName = "Expert A",
                    userId = 200,
                    userName = "User A",
                    createdAt = now,
                    updatedAt = now
                }
            };

            _mockChatExpertRepo
                .Setup(r => r.GetChatsByExpertIdAsync(expertId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(chats);

            var result = await _service.GetChatsByExpertIdAsync(expertId);
            var list = result.ToList();

            Assert.Single(list);

            var item = list.First();
            var type = item.GetType();

            Assert.Equal(10, (int)type.GetProperty("chatExpertId")!.GetValue(item)!);
            Assert.Equal(expertId, (int)type.GetProperty("expertId")!.GetValue(item)!);
            Assert.Equal("Expert A", (string?)type.GetProperty("expertName")!.GetValue(item));
            Assert.Equal(200, (int)type.GetProperty("userId")!.GetValue(item)!);
            Assert.Equal("User A", (string?)type.GetProperty("userName")!.GetValue(item));
            Assert.Equal(now, (DateTime)type.GetProperty("createdAt")!.GetValue(item)!);
            Assert.Equal(now, (DateTime)type.GetProperty("updatedAt")!.GetValue(item)!);
        }

        /// <summary>
        /// UTCID02: Expert exists but has no chats -> returns empty list.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetChatsByExpertIdAsync_ExpertExistsNoChats_ReturnsEmptyList()
        {
            const int expertId = 2;
            SeedExpert(expertId, "Expert B");

            _mockChatExpertRepo
                .Setup(r => r.GetChatsByExpertIdAsync(expertId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<object>());

            var result = await _service.GetChatsByExpertIdAsync(expertId);

            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: Expert not found or invalid expertId (999, 0, -1, int.MaxValue, int.MinValue) -> throws KeyNotFoundException.
        /// Counted as a single test in report.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetChatsByExpertIdAsync_ExpertNotFoundOrInvalid_ThrowsKeyNotFound()
        {
            var invalidExpertIds = new[] { 999, 0, -1, int.MaxValue, int.MinValue };

            foreach (var expertId in invalidExpertIds)
            {
                await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.GetChatsByExpertIdAsync(expertId));
            }
        }

        /// <summary>
        /// UTCID04: Expert exists but repository throws -> exception is propagated.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetChatsByExpertIdAsync_RepositoryThrows_PropagatesException()
        {
            const int expertId = 4;
            SeedExpert(expertId, "Expert C");

            _mockChatExpertRepo
                .Setup(r => r.GetChatsByExpertIdAsync(expertId, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("DB error"));

            await Assert.ThrowsAsync<Exception>(
                () => _service.GetChatsByExpertIdAsync(expertId));
        }
    }
}


