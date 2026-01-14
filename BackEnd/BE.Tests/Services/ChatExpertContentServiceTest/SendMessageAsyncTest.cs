using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatExpertContentServiceTest
{
    public class SendMessageAsyncTest : IDisposable
    {
        private readonly Mock<IChatExpertContentRepository> _mockContentRepo;
        private readonly Mock<IChatExpertRepository> _mockChatExpertRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly Mock<IDailyLimitService> _mockDailyLimitService;
        private readonly Mock<IBadWordService> _mockBadWordService;
        private readonly PawnderDatabaseContext _context;
        private readonly ChatExpertContentService _service;

        public SendMessageAsyncTest()
        {
            _mockContentRepo = new Mock<IChatExpertContentRepository>();
            _mockChatExpertRepo = new Mock<IChatExpertRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();
            _mockDailyLimitService = new Mock<IDailyLimitService>();
            _mockBadWordService = new Mock<IBadWordService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatExpertContentSendMessageDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new ChatExpertContentService(
                _mockContentRepo.Object,
                _mockChatExpertRepo.Object,
                _context,
                _mockHubContext.Object,
                _mockDailyLimitService.Object,
                _mockBadWordService.Object);

            // Setup default mocks
            SetupDefaultMocks();
        }

        private void SetupDefaultMocks()
        {
            // Setup HubContext mock to prevent null reference exceptions
            var mockClients = new Mock<IHubClients>();
            var mockClientProxy = new Mock<IClientProxy>();
            mockClients.Setup(c => c.User(It.IsAny<string>())).Returns(mockClientProxy.Object);
            mockClients.Setup(c => c.All).Returns(mockClientProxy.Object);
            _mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);

            // Setup DailyLimitService mock
            _mockDailyLimitService
                .Setup(d => d.CanPerformAction(It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(true);
            _mockDailyLimitService
                .Setup(d => d.RecordAction(It.IsAny<int>(), It.IsAny<string>()))
                .ReturnsAsync(true);

            // Setup ContentRepository AddAsync mock
            _mockContentRepo
                .Setup(r => r.AddAsync(It.IsAny<ChatExpertContent>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ChatExpertContent c, CancellationToken _) =>
                {
                    c.ContentId = 100;
                    return c;
                });
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId, string email, string fullName = "Test User")
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = email,
                    FullName = fullName,
                    PasswordHash = "hash",
                    UserStatusId = 2,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        private void SeedChatExpert(int chatExpertId, int expertId, int userId)
        {
            if (!_context.ChatExperts.Any(c => c.ChatExpertId == chatExpertId))
            {
                _context.ChatExperts.Add(new ChatExpert
                {
                    ChatExpertId = chatExpertId,
                    ExpertId = expertId,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        private void SeedExpertConfirmation(int expertId, int userId, int chatAiId)
        {
            if (!_context.ExpertConfirmations.Any(e => e.ExpertId == expertId && e.UserId == userId && e.ChatAiid == chatAiId))
            {
                _context.ExpertConfirmations.Add(new ExpertConfirmation
                {
                    ExpertId = expertId,
                    UserId = userId,
                    ChatAiid = chatAiId,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: chatExpertId=1 (valid, exists), fromId=1 (expertId, belongs to chat), 
        /// message="Hello" (valid), ExpertConfirmation=null
        /// -> Trả về object (success) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_SendMessageAsync_ValidExpertSendsMessage_ReturnsSuccessObject()
        {
            // Arrange
            const int chatExpertId = 1;
            const int expertId = 1;
            const int userId = 2;
            const string message = "Hello";

            SeedUser(expertId, "expert@test.com", "Expert Name");
            SeedUser(userId, "user@test.com", "User Name");
            SeedChatExpert(chatExpertId, expertId, userId);

            // Act
            var result = await _service.SendMessageAsync(chatExpertId, expertId, message, null, null, null);

            // Assert
            var type = result.GetType();
            Assert.Equal("Gửi tin nhắn thành công.", (string)type.GetProperty("message")!.GetValue(result)!);
            Assert.NotNull(type.GetProperty("contentId")!.GetValue(result));
            Assert.Equal(chatExpertId, (int)type.GetProperty("chatExpertId")!.GetValue(result)!);
            Assert.Equal(expertId, (int)type.GetProperty("fromId")!.GetValue(result)!);
            Assert.NotNull(type.GetProperty("createdAt")!.GetValue(result));
        }

        /// <summary>
        /// UTCID02: chatExpertId=1 (valid, exists), fromId=1 (expertId, belongs to chat),
        /// message="Hello" (valid), ExpertConfirmation=provided AND EXISTS
        /// -> Trả về object (success) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID02_SendMessageAsync_ValidMessageWithExpertConfirmation_ReturnsSuccessObject()
        {
            // Arrange
            const int chatExpertId = 1;
            const int expertId = 1;
            const int userId = 2;
            const int chatAiId = 10;
            const string message = "Hello";

            SeedUser(expertId, "expert@test.com", "Expert Name");
            SeedUser(userId, "user@test.com", "User Name");
            SeedChatExpert(chatExpertId, expertId, userId);
            SeedExpertConfirmation(expertId, userId, chatAiId);

            // Act
            var result = await _service.SendMessageAsync(chatExpertId, expertId, message, expertId, userId, chatAiId);

            // Assert
            var type = result.GetType();
            Assert.Equal("Gửi tin nhắn thành công.", (string)type.GetProperty("message")!.GetValue(result)!);
            Assert.NotNull(type.GetProperty("contentId")!.GetValue(result));
            Assert.Equal(chatExpertId, (int)type.GetProperty("chatExpertId")!.GetValue(result)!);
            Assert.Equal(expertId, (int)type.GetProperty("fromId")!.GetValue(result)!);
            Assert.NotNull(type.GetProperty("createdAt")!.GetValue(result));
        }

        /// <summary>
        /// UTCID03: chatExpertId=1 (valid, exists), fromId=1 (expertId, belongs to chat),
        /// message=null, "", "   " (invalid)
        /// -> Ném ArgumentException với message "Tin nhắn không được để trống."
        /// </summary>
        [Fact]
        public async Task UTCID03_SendMessageAsync_InvalidMessage_ThrowsArgumentException()
        {
            // Arrange
            const int chatExpertId = 1;
            const int expertId = 1;
            const int userId = 2;

            SeedUser(expertId, "expert@test.com", "Expert Name");
            SeedUser(userId, "user@test.com", "User Name");
            SeedChatExpert(chatExpertId, expertId, userId);

            var invalidMessages = new[] { null!, "", "   " };

            foreach (var message in invalidMessages)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<ArgumentException>(
                    () => _service.SendMessageAsync(chatExpertId, expertId, message, null, null, null));

                Assert.Equal("Tin nhắn không được để trống.", ex.Message);
            }
        }

        /// <summary>
        /// UTCID04: chatExpertId=999 (valid, not exists), message="Hello" (valid)
        /// -> Ném KeyNotFoundException với message "Không tồn tại đoạn chat."
        /// </summary>
        [Fact]
        public async Task UTCID04_SendMessageAsync_ChatNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int chatExpertId = 999;
            const int fromId = 1;
            const string message = "Hello";

            SeedUser(fromId, "user@test.com", "User Name");

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.SendMessageAsync(chatExpertId, fromId, message, null, null, null));

            Assert.Equal("Không tồn tại đoạn chat.", ex.Message);
        }

        /// <summary>
        /// UTCID05: chatExpertId=1 (valid, exists), fromId=2 (userId, belongs to chat),
        /// message="Hello" (valid), ExpertConfirmation=null
        /// -> Trả về object (success) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID05_SendMessageAsync_ValidUserSendsMessage_ReturnsSuccessObject()
        {
            // Arrange
            const int chatExpertId = 1;
            const int expertId = 1;
            const int userId = 2;
            const string message = "Hello";

            SeedUser(expertId, "expert@test.com", "Expert Name");
            SeedUser(userId, "user@test.com", "User Name");
            SeedChatExpert(chatExpertId, expertId, userId);

            // Act
            var result = await _service.SendMessageAsync(chatExpertId, userId, message, null, null, null);

            // Assert
            var type = result.GetType();
            Assert.Equal("Gửi tin nhắn thành công.", (string)type.GetProperty("message")!.GetValue(result)!);
            Assert.NotNull(type.GetProperty("contentId")!.GetValue(result));
            Assert.Equal(chatExpertId, (int)type.GetProperty("chatExpertId")!.GetValue(result)!);
            Assert.Equal(userId, (int)type.GetProperty("fromId")!.GetValue(result)!);
            Assert.NotNull(type.GetProperty("createdAt")!.GetValue(result));
        }

        /// <summary>
        /// UTCID06: chatExpertId=1 (valid, exists), fromId=999 (not belongs to chat),
        /// message="Hello" (valid)
        /// -> Ném InvalidOperationException với message "Người dùng không thuộc cuộc chat này."
        /// </summary>
        [Fact]
        public async Task UTCID06_SendMessageAsync_UserNotBelongsToChat_ThrowsInvalidOperationException()
        {
            // Arrange
            const int chatExpertId = 1;
            const int expertId = 1;
            const int userId = 2;
            const int unauthorizedUserId = 999;
            const string message = "Hello";

            SeedUser(expertId, "expert@test.com", "Expert Name");
            SeedUser(userId, "user@test.com", "User Name");
            SeedUser(unauthorizedUserId, "unauthorized@test.com", "Unauthorized User");
            SeedChatExpert(chatExpertId, expertId, userId);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.SendMessageAsync(chatExpertId, unauthorizedUserId, message, null, null, null));

            Assert.Equal("Người dùng không thuộc cuộc chat này.", ex.Message);
        }

        /// <summary>
        /// UTCID07: chatExpertId invalid (0, -1, int.MaxValue, int.MinValue)
        /// -> Ném KeyNotFoundException với message "Không tồn tại đoạn chat."
        /// </summary>
        [Fact]
        public async Task UTCID07_SendMessageAsync_InvalidChatExpertId_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int fromId = 1;
            const string message = "Hello";

            SeedUser(fromId, "user@test.com", "User Name");

            var invalidChatExpertIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var chatExpertId in invalidChatExpertIds)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.SendMessageAsync(chatExpertId, fromId, message, null, null, null));

                Assert.Equal("Không tồn tại đoạn chat.", ex.Message);
            }
        }

        /// <summary>
        /// UTCID08: fromId invalid (0, -1, int.MaxValue, int.MinValue), chat exists
        /// -> Ném InvalidOperationException với message "Người dùng không thuộc cuộc chat này."
        /// </summary>
        [Fact]
        public async Task UTCID08_SendMessageAsync_InvalidFromId_ThrowsInvalidOperationException()
        {
            // Arrange
            const int chatExpertId = 1;
            const int expertId = 1;
            const int userId = 2;
            const string message = "Hello";

            SeedUser(expertId, "expert@test.com", "Expert Name");
            SeedUser(userId, "user@test.com", "User Name");
            SeedChatExpert(chatExpertId, expertId, userId);

            var invalidFromIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var fromId in invalidFromIds)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                    () => _service.SendMessageAsync(chatExpertId, fromId, message, null, null, null));

                Assert.Equal("Người dùng không thuộc cuộc chat này.", ex.Message);
            }
        }

        /// <summary>
        /// UTCID09: chatExpertId=1, fromId=1, ExpertConfirmation=provided but NOT EXISTS
        /// -> Ném KeyNotFoundException với message "Không tìm thấy xác nhận chuyên gia."
        /// </summary>
        [Fact]
        public async Task UTCID09_SendMessageAsync_ExpertConfirmationNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int chatExpertId = 1;
            const int expertId = 1;
            const int userId = 2;
            const int chatAiId = 999; // Non-existent chatAiId
            const string message = "Hello";

            SeedUser(expertId, "expert@test.com", "Expert Name");
            SeedUser(userId, "user@test.com", "User Name");
            SeedChatExpert(chatExpertId, expertId, userId);
            // Note: NOT seeding ExpertConfirmation so it doesn't exist

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.SendMessageAsync(chatExpertId, expertId, message, expertId, userId, chatAiId));

            Assert.Equal("Không tìm thấy xác nhận chuyên gia.", ex.Message);
        }
    }
}
