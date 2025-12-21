using BE.Models;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatAIServiceTest
{
    public class GetAllChatsAsyncTest : IDisposable
    {
        private readonly Mock<IGeminiAIService> _mockGemini;
        private readonly PawnderDatabaseContext _context;
        private readonly DailyLimitService _dailyLimitService;
        private readonly ChatAIService _service;

        public GetAllChatsAsyncTest()
        {
            _mockGemini = new Mock<IGeminiAIService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatAIGetAllChatsDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _dailyLimitService = new DailyLimitService(_context);
            _service = new ChatAIService(_mockGemini.Object, _context, _dailyLimitService);
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
        /// UTCID01: Valid user with existing chats -> returns populated list with chat metadata.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetAllChatsAsync_UserWithChats_ReturnsChatList()
        {
            const int userId = 1;
            SeedUser(userId);

            var chat = new ChatAi
            {
                UserId = userId,
                Title = "My first chat",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            };
            _context.ChatAis.Add(chat);
            _context.SaveChanges();

            _context.ChatAicontents.AddRange(
                new ChatAicontent
                {
                    ChatAiid = chat.ChatAiid,
                    Question = "First question",
                    CreatedAt = DateTime.UtcNow.AddHours(-2),
                    UpdatedAt = DateTime.UtcNow.AddHours(-2)
                },
                new ChatAicontent
                {
                    ChatAiid = chat.ChatAiid,
                    Question = "Second question",
                    CreatedAt = DateTime.UtcNow.AddHours(-1),
                    UpdatedAt = DateTime.UtcNow.AddHours(-1)
                });

            // Additional chats that should be filtered out
            _context.ChatAis.Add(new ChatAi
            {
                UserId = userId,
                Title = "Deleted chat",
                IsDeleted = true,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            });

            _context.ChatAis.Add(new ChatAi
            {
                UserId = 999,
                Title = "Other user chat",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            });

            _context.SaveChanges();

            var result = await _service.GetAllChatsAsync(userId);
            var list = result.ToList();

            Assert.Single(list);

            var chatResult = list.First();
            var type = chatResult.GetType();

            Assert.Equal(chat.ChatAiid, (int)type.GetProperty("ChatAiid")!.GetValue(chatResult)!);
            Assert.Equal(chat.Title, (string?)type.GetProperty("Title")!.GetValue(chatResult));
            Assert.Equal(chat.CreatedAt, (DateTime?)type.GetProperty("CreatedAt")!.GetValue(chatResult));
            Assert.Equal(chat.UpdatedAt, (DateTime?)type.GetProperty("UpdatedAt")!.GetValue(chatResult));
            Assert.Equal(2, (int)type.GetProperty("MessageCount")!.GetValue(chatResult)!);
            Assert.Equal("Second question", (string?)type.GetProperty("LastQuestion")!.GetValue(chatResult));
        }

        /// <summary>
        /// UTCID02: Valid user with no chats -> returns empty list.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetAllChatsAsync_UserWithNoChats_ReturnsEmptyList()
        {
            const int userId = 2;
            SeedUser(userId);

            var result = await _service.GetAllChatsAsync(userId);
            var list = result.ToList();

            Assert.Empty(list);
        }

        /// <summary>
        /// UTCID03: Invalid userId (0) -> returns empty list without throwing.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetAllChatsAsync_InvalidUserId_ReturnsEmptyList()
        {
            var result = await _service.GetAllChatsAsync(0);
            var list = result.ToList();

            Assert.Empty(list);
        }
    }
}

