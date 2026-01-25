using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.MatchServiceTest
{
    public class SendLikeAsyncTest : IDisposable
    {
        private readonly Mock<IChatUserRepository> _mockChatUserRepo;
        private readonly Mock<IBlockRepository> _mockBlockRepo;
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly PawnderDatabaseContext _limitContext;
        private readonly DailyLimitService _dailyLimitService;
        private readonly MatchService _service;

        public SendLikeAsyncTest()
        {
            _mockChatUserRepo = new Mock<IChatUserRepository>();
            _mockBlockRepo = new Mock<IBlockRepository>();
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"MatchServiceSendLikeDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Create DailyLimitService with its own context
            var limitServiceOptions = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"DailyLimitDb_{Guid.NewGuid()}")
                .Options;
            _limitContext = new PawnderDatabaseContext(limitServiceOptions);
            _dailyLimitService = new DailyLimitService(_limitContext);

            _service = new MatchService(
                _mockChatUserRepo.Object,
                _mockBlockRepo.Object,
                _mockNotificationRepo.Object,
                _context,
                _mockHubContext.Object,
                _dailyLimitService);

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

            // Setup ChatUserRepository AddAsync mock
            _mockChatUserRepo
                .Setup(r => r.AddAsync(It.IsAny<ChatUser>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ChatUser cu, CancellationToken _) => cu);

            // Setup ChatUserRepository UpdateAsync mock
            _mockChatUserRepo
                .Setup(r => r.UpdateAsync(It.IsAny<ChatUser>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Setup BlockRepository - default no block
            _mockBlockRepo
                .Setup(r => r.GetBlockAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Block?)null);
        }

        public void Dispose()
        {
            _context.Dispose();
            _limitContext.Dispose();
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
                    IsDeleted = false,
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
                    Gender = "Male",
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Pets.Add(pet);
                _context.SaveChanges();
            }
            return pet;
        }

        private void SeedChatUser(int matchId, int fromPetId, int toPetId, int fromUserId, int toUserId, string status = "Pending", bool isDeleted = false)
        {
            if (!_context.ChatUsers.Any(c => c.MatchId == matchId))
            {
                _context.ChatUsers.Add(new ChatUser
                {
                    MatchId = matchId,
                    FromPetId = fromPetId,
                    ToPetId = toPetId,
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    Status = status,
                    IsDeleted = isDeleted,
                    CreatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        private void SeedDailyLimitUsage(int userId, string actionType, int count)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            if (!_limitContext.DailyLimits.Any(d => d.UserId == userId && d.ActionType == actionType && d.ActionDate == today))
            {
                _limitContext.DailyLimits.Add(new DailyLimit
                {
                    UserId = userId,
                    ActionType = actionType,
                    ActionDate = today,
                    Count = count,
                    CreatedAt = DateTime.Now
                });
                _limitContext.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: Daily limit can perform action, FromUserId != ToUserId, not blocked, 
        /// no existing like, Reciprocal like exists → It's a match!
        /// -> Trả về object với isMatch = true.
        /// </summary>
        [Fact]
        public async Task UTCID01_SendLikeAsync_ReciprocalLikeExists_ReturnsMatch()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            // Seed reciprocal like (toUser liked fromUser's pet with toPet)
            SeedChatUser(1, toPet.PetId, fromPet.PetId, toUserId, fromUserId, "Pending");

            var request = new LikeRequest
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                FromPetId = fromPet.PetId,
                ToPetId = toPet.PetId
            };

            // Act
            var result = await _service.SendLikeAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var isMatch = (bool)type.GetProperty("isMatch")!.GetValue(result)!;
            var status = (string)type.GetProperty("status")!.GetValue(result)!;

            Assert.True(isMatch);
            Assert.Equal("Accepted", status);
        }

        /// <summary>
        /// UTCID02: Daily limit can perform action, FromUserId != ToUserId, not blocked, 
        /// no existing like, no reciprocal like → Like sent
        /// -> Trả về object với isMatch = false.
        /// </summary>
        [Fact]
        public async Task UTCID02_SendLikeAsync_NoReciprocalLike_ReturnsLikeSent()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");
            // No reciprocal like

            var request = new LikeRequest
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                FromPetId = fromPet.PetId,
                ToPetId = toPet.PetId
            };

            // Act
            var result = await _service.SendLikeAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var isMatch = (bool)type.GetProperty("isMatch")!.GetValue(result)!;
            var status = (string)type.GetProperty("status")!.GetValue(result)!;

            Assert.False(isMatch);
            Assert.Equal("Pending", status);
        }

        /// <summary>
        /// UTCID03: Daily limit exceeded (DailyLimitService.CanPerformAction returns false)
        /// -> Ném InvalidOperationException với message về limit.
        /// </summary>
        [Fact]
        public async Task UTCID03_SendLikeAsync_DailyLimitExceeded_ThrowsInvalidOperationException()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            // Exceed daily limit (quota is 10 for request_match)
            SeedDailyLimitUsage(fromUserId, "request_match", 100);

            var request = new LikeRequest
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                FromPetId = fromPet.PetId,
                ToPetId = toPet.PetId
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.SendLikeAsync(request));

            Assert.Contains("hết lượt", ex.Message);
        }

        /// <summary>
        /// UTCID04: FromUserId == ToUserId (self like)
        /// -> Ném InvalidOperationException với message "Cannot like yourself".
        /// </summary>
        [Fact]
        public async Task UTCID04_SendLikeAsync_SelfLike_ThrowsInvalidOperationException()
        {
            // Arrange
            const int userId = 1;

            SeedUser(userId, "user@test.com", "Test User");

            var pet1 = SeedPet(1, userId, "Pet 1");
            var pet2 = SeedPet(2, userId, "Pet 2");

            var request = new LikeRequest
            {
                FromUserId = userId,
                ToUserId = userId, // Same user
                FromPetId = pet1.PetId,
                ToPetId = pet2.PetId
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.SendLikeAsync(request));

            Assert.Contains("Cannot like yourself", ex.Message);
        }

        /// <summary>
        /// UTCID05: Existing like exists (same pet pair)
        /// -> Ném InvalidOperationException với message "Already liked this pet".
        /// </summary>
        [Fact]
        public async Task UTCID05_SendLikeAsync_ExistingLike_ThrowsInvalidOperationException()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            // Existing like with same pet pair
            SeedChatUser(1, fromPet.PetId, toPet.PetId, fromUserId, toUserId, "Pending");

            var request = new LikeRequest
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                FromPetId = fromPet.PetId,
                ToPetId = toPet.PetId
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.SendLikeAsync(request));

            Assert.Contains("Already liked this pet", ex.Message);
        }
    }
}
