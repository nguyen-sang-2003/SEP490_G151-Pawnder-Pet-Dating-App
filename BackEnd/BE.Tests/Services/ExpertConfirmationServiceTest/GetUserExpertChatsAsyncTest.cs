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
    public class GetUserExpertChatsAsyncTest : IDisposable
    {
        private readonly Mock<IExpertConfirmationRepository> _mockExpertConfirmationRepo;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly ExpertConfirmationService _service;

        public GetUserExpertChatsAsyncTest()
        {
            _mockExpertConfirmationRepo = new Mock<IExpertConfirmationRepository>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ExpertConfirmationGetUserChatsDb_{Guid.NewGuid()}")
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

        private void SeedUser(int userId, string email, int roleId = 3, string fullName = "Test User")
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = email,
                    FullName = fullName,
                    PasswordHash = "hash",
                    RoleId = roleId,
                    UserStatusId = 2,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        private ChatExpert SeedChatExpert(int chatExpertId, int userId, int expertId)
        {
            var chatExpert = _context.ChatExperts.FirstOrDefault(c => c.ChatExpertId == chatExpertId);
            if (chatExpert == null)
            {
                chatExpert = new ChatExpert
                {
                    ChatExpertId = chatExpertId,
                    UserId = userId,
                    ExpertId = expertId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ChatExperts.Add(chatExpert);
                _context.SaveChanges();
            }
            return chatExpert;
        }

        private void SeedChatExpertContent(int contentId, int chatExpertId, int fromId, string message)
        {
            if (!_context.ChatExpertContents.Any(c => c.ContentId == contentId))
            {
                _context.ChatExpertContents.Add(new ChatExpertContent
                {
                    ContentId = contentId,
                    ChatExpertId = chatExpertId,
                    FromId = fromId,
                    Message = message,
                    CreatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: UserId valid, User has multiple ChatExpert (>1), ChatExpertContent exists=yes, Expert.FullName available
        /// -> Trả về IEnumerable<object> với Count > 1.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetUserExpertChatsAsync_MultipleChatsWithContent_ReturnsMultipleResults()
        {
            // Arrange
            const int userId = 1;
            const int expertId1 = 2;
            const int expertId2 = 3;

            SeedUser(userId, "user@test.com", 3, "Test User");
            SeedUser(expertId1, "expert1@test.com", 2, "Expert One");
            SeedUser(expertId2, "expert2@test.com", 2, "Expert Two");

            SeedChatExpert(1, userId, expertId1);
            SeedChatExpert(2, userId, expertId2);

            SeedChatExpertContent(1, 1, userId, "Hello expert 1");
            SeedChatExpertContent(2, 2, userId, "Hello expert 2");

            // Act
            var result = await _service.GetUserExpertChatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.True(resultList.Count > 1);

            // Verify properties of first chat
            var firstChat = resultList[0];
            var type = firstChat.GetType();
            Assert.NotNull(type.GetProperty("chatExpertId")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("expertId")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("expertName")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("lastMessage")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("time")!.GetValue(firstChat));
        }

        /// <summary>
        /// UTCID02: UserId valid, User has single ChatExpert (=1), ChatExpertContent exists=yes, Expert.FullName available
        /// -> Trả về IEnumerable<object> với Count = 1.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetUserExpertChatsAsync_SingleChatWithContent_ReturnsSingleResult()
        {
            // Arrange
            const int userId = 1;
            const int expertId = 2;

            SeedUser(userId, "user@test.com", 3, "Test User");
            SeedUser(expertId, "expert@test.com", 2, "Expert User");

            SeedChatExpert(1, userId, expertId);
            SeedChatExpertContent(1, 1, userId, "Hello expert");

            // Act
            var result = await _service.GetUserExpertChatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);

            // Verify properties
            var chat = resultList[0];
            var type = chat.GetType();
            Assert.NotNull(type.GetProperty("chatExpertId")!.GetValue(chat));
            Assert.NotNull(type.GetProperty("expertId")!.GetValue(chat));
            Assert.NotNull(type.GetProperty("expertName")!.GetValue(chat));
            Assert.Equal("Hello expert", (string)type.GetProperty("lastMessage")!.GetValue(chat)!);
        }

        /// <summary>
        /// UTCID03: UserId valid, User has no ChatExpert (=0)
        /// -> Trả về IEnumerable<object> với Count = 0 (empty).
        /// </summary>
        [Fact]
        public async Task UTCID03_GetUserExpertChatsAsync_NoChats_ReturnsEmptyList()
        {
            // Arrange
            const int userId = 1;

            SeedUser(userId, "user@test.com", 3, "Test User");
            // No ChatExpert seeded for this user

            // Act
            var result = await _service.GetUserExpertChatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID04: UserId valid, User has multiple ChatExpert (>1), ChatExpertContent does NOT exist, Expert.FullName available
        /// -> Trả về IEnumerable<object> (not null) với lastMessage là default message.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetUserExpertChatsAsync_MultipleChatsNoContent_ReturnsResultsWithDefaultMessage()
        {
            // Arrange
            const int userId = 1;
            const int expertId1 = 2;
            const int expertId2 = 3;

            SeedUser(userId, "user@test.com", 3, "Test User");
            SeedUser(expertId1, "expert1@test.com", 2, "Expert One");
            SeedUser(expertId2, "expert2@test.com", 2, "Expert Two");

            SeedChatExpert(1, userId, expertId1);
            SeedChatExpert(2, userId, expertId2);
            // No ChatExpertContent seeded

            // Act
            var result = await _service.GetUserExpertChatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.True(resultList.Count > 1);

            // Verify lastMessage is default when no content exists
            var firstChat = resultList[0];
            var type = firstChat.GetType();
            var lastMessage = (string)type.GetProperty("lastMessage")!.GetValue(firstChat)!;
            Assert.Equal("Chưa có tin nhắn", lastMessage);
        }
    }
}
