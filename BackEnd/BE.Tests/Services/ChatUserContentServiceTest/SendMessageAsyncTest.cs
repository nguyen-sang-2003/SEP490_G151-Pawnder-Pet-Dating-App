using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatUserContentServiceTest
{
    public class SendMessageAsyncTest : IDisposable
    {
        private readonly Mock<IChatUserContentRepository> _mockContentRepo;
        private readonly Mock<IChatUserRepository> _mockChatUserRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly Mock<IBadWordService> _mockBadWordService;
        private readonly PawnderDatabaseContext _context;
        private readonly ChatUserContentService _service;

        public SendMessageAsyncTest()
        {
            _mockContentRepo = new Mock<IChatUserContentRepository>();
            _mockChatUserRepo = new Mock<IChatUserRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();
            _mockBadWordService = new Mock<IBadWordService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatUserContentSendMessageDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new ChatUserContentService(
                _mockContentRepo.Object,
                _mockChatUserRepo.Object,
                _context,
                _mockHubContext.Object,
                _mockBadWordService.Object);

            // Setup default mocks
            SetupDefaultMocks();
        }

        private void SetupDefaultMocks()
        {
            // Setup HubContext mock
            var mockClients = new Mock<IHubClients>();
            var mockClientProxy = new Mock<IClientProxy>();
            var mockSingleClientProxy = new Mock<ISingleClientProxy>();
            mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
            mockClients.Setup(c => c.User(It.IsAny<string>())).Returns(mockClientProxy.Object);
            mockClients.Setup(c => c.Client(It.IsAny<string>())).Returns(mockSingleClientProxy.Object);
            _mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);

            // Setup ContentRepository AddAsync mock
            _mockContentRepo
                .Setup(r => r.AddAsync(It.IsAny<ChatUserContent>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ChatUserContent c, CancellationToken _) =>
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

        private Pet SeedPet(int petId, int userId, string name)
        {
            var pet = _context.Pets.FirstOrDefault(p => p.PetId == petId);
            if (pet == null)
            {
                pet = new Pet
                {
                    PetId = petId,
                    UserId = userId,
                    Name = name,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Pets.Add(pet);
                _context.SaveChanges();
            }
            return pet;
        }

        private void SeedChatUser(int matchId, int fromPetId, int toPetId, string status = "Accepted", bool isDeleted = false)
        {
            if (!_context.ChatUsers.Any(c => c.MatchId == matchId))
            {
                _context.ChatUsers.Add(new ChatUser
                {
                    MatchId = matchId,
                    FromPetId = fromPetId,
                    ToPetId = toPetId,
                    Status = status,
                    IsDeleted = isDeleted,
                    CreatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: matchId=1 (valid, exists), fromUserId=1 (belongs to match via FromPet),
        /// message="Hello" (valid), Status="Accepted", IsDeleted=FALSE
        /// -> Trả về object (success) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_SendMessageAsync_ValidFromPetUser_ReturnsSuccessObject()
        {
            // Arrange
            const int matchId = 1;
            const int fromUserId = 1;
            const int toUserId = 2;
            const string message = "Hello";

            SeedUser(fromUserId, "user1@test.com", "User 1");
            SeedUser(toUserId, "user2@test.com", "User 2");
            var fromPet = SeedPet(1, fromUserId, "Pet 1");
            var toPet = SeedPet(2, toUserId, "Pet 2");
            SeedChatUser(matchId, fromPet.PetId, toPet.PetId, "Accepted", false);

            // Act
            var result = await _service.SendMessageAsync(matchId, fromUserId, message);

            // Assert
            var type = result.GetType();
            Assert.Equal("Gửi tin nhắn thành công.", (string)type.GetProperty("message")!.GetValue(result)!);
            Assert.NotNull(type.GetProperty("contentId")!.GetValue(result));
            Assert.NotNull(type.GetProperty("createdAt")!.GetValue(result));
        }

        /// <summary>
        /// UTCID02: matchId=1 (valid, exists), fromUserId=2 (belongs to match via ToPet),
        /// message="Hello" (valid), Status="Accepted", IsDeleted=FALSE
        /// -> Trả về object (success) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID02_SendMessageAsync_ValidToPetUser_ReturnsSuccessObject()
        {
            // Arrange
            const int matchId = 1;
            const int fromUserId = 1;
            const int toUserId = 2;
            const string message = "Hello";

            SeedUser(fromUserId, "user1@test.com", "User 1");
            SeedUser(toUserId, "user2@test.com", "User 2");
            var fromPet = SeedPet(1, fromUserId, "Pet 1");
            var toPet = SeedPet(2, toUserId, "Pet 2");
            SeedChatUser(matchId, fromPet.PetId, toPet.PetId, "Accepted", false);

            // Act - Message sent by ToPet user
            var result = await _service.SendMessageAsync(matchId, toUserId, message);

            // Assert
            var type = result.GetType();
            Assert.Equal("Gửi tin nhắn thành công.", (string)type.GetProperty("message")!.GetValue(result)!);
            Assert.NotNull(type.GetProperty("contentId")!.GetValue(result));
            Assert.NotNull(type.GetProperty("createdAt")!.GetValue(result));
        }

        /// <summary>
        /// UTCID03: matchId=1 (valid, exists), fromUserId=1 (belongs to match),
        /// message=null, "", " " (invalid)
        /// -> Ném ArgumentException với message "Tin nhắn không được để trống."
        /// </summary>
        [Fact]
        public async Task UTCID03_SendMessageAsync_InvalidMessage_ThrowsArgumentException()
        {
            // Arrange
            const int matchId = 1;
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "user1@test.com", "User 1");
            SeedUser(toUserId, "user2@test.com", "User 2");
            var fromPet = SeedPet(1, fromUserId, "Pet 1");
            var toPet = SeedPet(2, toUserId, "Pet 2");
            SeedChatUser(matchId, fromPet.PetId, toPet.PetId, "Accepted", false);

            var invalidMessages = new[] { null!, "", "   " };

            foreach (var message in invalidMessages)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<ArgumentException>(
                    () => _service.SendMessageAsync(matchId, fromUserId, message));

                Assert.Equal("Tin nhắn không được để trống.", ex.Message);
            }
        }

        /// <summary>
        /// UTCID04: matchId=999 (valid, not exists), message="Hello" (valid), MatchExists=FALSE
        /// -> Ném KeyNotFoundException với message "Không tồn tại đoạn chat."
        /// </summary>
        [Fact]
        public async Task UTCID04_SendMessageAsync_MatchNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int matchId = 999;
            const int fromUserId = 1;
            const string message = "Hello";

            SeedUser(fromUserId, "user1@test.com", "User 1");

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.SendMessageAsync(matchId, fromUserId, message));

            Assert.Equal("Không tồn tại đoạn chat.", ex.Message);
        }

        /// <summary>
        /// UTCID05: matchId=1 (valid, exists), fromUserId=999 (not belongs to match),
        /// message="Hello" (valid), MatchExists=TRUE
        /// -> Ném InvalidOperationException với message "Người dùng không thuộc cuộc chat này."
        /// </summary>
        [Fact]
        public async Task UTCID05_SendMessageAsync_UserNotBelongsToMatch_ThrowsInvalidOperationException()
        {
            // Arrange
            const int matchId = 1;
            const int fromUserId = 1;
            const int toUserId = 2;
            const int unauthorizedUserId = 999;
            const string message = "Hello";

            SeedUser(fromUserId, "user1@test.com", "User 1");
            SeedUser(toUserId, "user2@test.com", "User 2");
            SeedUser(unauthorizedUserId, "unauthorized@test.com", "Unauthorized User");
            var fromPet = SeedPet(1, fromUserId, "Pet 1");
            var toPet = SeedPet(2, toUserId, "Pet 2");
            SeedChatUser(matchId, fromPet.PetId, toPet.PetId, "Accepted", false);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.SendMessageAsync(matchId, unauthorizedUserId, message));

            Assert.Equal("Người dùng không thuộc cuộc chat này.", ex.Message);
        }

        /// <summary>
        /// UTCID06: matchId invalid (0, -1, int.MaxValue, int.MinValue), MatchExists=FALSE
        /// -> Ném KeyNotFoundException với message "Không tồn tại đoạn chat."
        /// </summary>
        [Fact]
        public async Task UTCID06_SendMessageAsync_InvalidMatchId_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int fromUserId = 1;
            const string message = "Hello";

            SeedUser(fromUserId, "user1@test.com", "User 1");

            var invalidMatchIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var matchId in invalidMatchIds)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.SendMessageAsync(matchId, fromUserId, message));

                Assert.Equal("Không tồn tại đoạn chat.", ex.Message);
            }
        }

        /// <summary>
        /// UTCID07: fromUserId invalid (0, -1, int.MaxValue, int.MinValue), 
        /// matchId=1 (valid, exists), message="Hello", MatchExists=TRUE
        /// -> Ném InvalidOperationException với message "Người dùng không thuộc cuộc chat này."
        /// </summary>
        [Fact]
        public async Task UTCID07_SendMessageAsync_InvalidFromUserId_ThrowsInvalidOperationException()
        {
            // Arrange
            const int matchId = 1;
            const int fromUserId = 1;
            const int toUserId = 2;
            const string message = "Hello";

            SeedUser(fromUserId, "user1@test.com", "User 1");
            SeedUser(toUserId, "user2@test.com", "User 2");
            var fromPet = SeedPet(1, fromUserId, "Pet 1");
            var toPet = SeedPet(2, toUserId, "Pet 2");
            SeedChatUser(matchId, fromPet.PetId, toPet.PetId, "Accepted", false);

            var invalidFromUserIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var invalidUserId in invalidFromUserIds)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                    () => _service.SendMessageAsync(matchId, invalidUserId, message));

                Assert.Equal("Người dùng không thuộc cuộc chat này.", ex.Message);
            }
        }
    }
}
