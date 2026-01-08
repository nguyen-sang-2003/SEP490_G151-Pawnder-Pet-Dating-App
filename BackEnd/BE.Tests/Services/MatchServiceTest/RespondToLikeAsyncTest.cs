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
    public class RespondToLikeAsyncTest : IDisposable
    {
        private readonly Mock<IChatUserRepository> _mockChatUserRepo;
        private readonly Mock<IBlockRepository> _mockBlockRepo;
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly MatchService _service;

        public RespondToLikeAsyncTest()
        {
            _mockChatUserRepo = new Mock<IChatUserRepository>();
            _mockBlockRepo = new Mock<IBlockRepository>();
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"MatchServiceRespondDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Create DailyLimitService
            var limitServiceOptions = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"DailyLimitDb_{Guid.NewGuid()}")
                .Options;
            var limitContext = new PawnderDatabaseContext(limitServiceOptions);
            var dailyLimitService = new DailyLimitService(limitContext);

            _service = new MatchService(
                _mockChatUserRepo.Object,
                _mockBlockRepo.Object,
                _mockNotificationRepo.Object,
                _context,
                _mockHubContext.Object,
                dailyLimitService);

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

            // Setup ChatUserRepository UpdateAsync mock
            _mockChatUserRepo
                .Setup(r => r.UpdateAsync(It.IsAny<ChatUser>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
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

        private ChatUser SeedChatUser(int matchId, int? fromPetId, int? toPetId, int? fromUserId, int? toUserId, string status = "Pending", bool isDeleted = false)
        {
            var chatUser = _context.ChatUsers.FirstOrDefault(c => c.MatchId == matchId);
            if (chatUser == null)
            {
                chatUser = new ChatUser
                {
                    MatchId = matchId,
                    FromPetId = fromPetId,
                    ToPetId = toPetId,
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    Status = status,
                    IsDeleted = isDeleted,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ChatUsers.Add(chatUser);
                _context.SaveChanges();
            }
            return chatUser;
        }

        /// <summary>
        /// UTCID01: Action="pass", ChatUserExists=TRUE, Status="Pending", IsDeleted=FALSE, FromPet/ToPet not null
        /// -> Trả về object với message: "Passed".
        /// </summary>
        [Fact]
        public async Task UTCID01_RespondToLikeAsync_PassPending_ReturnsPassed()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            SeedChatUser(1, fromPet.PetId, toPet.PetId, fromUserId, toUserId, "Pending");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "pass"
            };

            // Act
            var result = await _service.RespondToLikeAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var message = (string)type.GetProperty("message")!.GetValue(result)!;
            Assert.Equal("Passed", message);
        }

        /// <summary>
        /// UTCID02: Action="PASS" (case-insensitive), ChatUserExists=TRUE, Status="Pending"
        /// -> Trả về object với message: "Passed".
        /// </summary>
        [Fact]
        public async Task UTCID02_RespondToLikeAsync_PassCaseInsensitive_ReturnsPassed()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            SeedChatUser(1, fromPet.PetId, toPet.PetId, fromUserId, toUserId, "Pending");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "PASS"
            };

            // Act
            var result = await _service.RespondToLikeAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var message = (string)type.GetProperty("message")!.GetValue(result)!;
            Assert.Equal("Passed", message);
        }

        /// <summary>
        /// UTCID03: Action="pass", Status="Accepted" (unmatch scenario)
        /// -> Trả về object với message: "Unmatched".
        /// </summary>
        [Fact]
        public async Task UTCID03_RespondToLikeAsync_PassAccepted_ReturnsUnmatched()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            SeedChatUser(1, fromPet.PetId, toPet.PetId, fromUserId, toUserId, "Accepted");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "pass"
            };

            // Act
            var result = await _service.RespondToLikeAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var message = (string)type.GetProperty("message")!.GetValue(result)!;
            Assert.Equal("Unmatched", message);
        }

        /// <summary>
        /// UTCID04: ChatUser does not exist
        /// -> Ném KeyNotFoundException với message "Like request not found".
        /// </summary>
        [Fact]
        public async Task UTCID04_RespondToLikeAsync_ChatUserNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            var request = new RespondRequest
            {
                MatchId = 999, // Non-existent
                Action = "match"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.RespondToLikeAsync(request));

            Assert.Contains("Like request not found", ex.Message);
        }

        /// <summary>
        /// UTCID05: ChatUser exists but pass action with non-pending status for "match" action
        /// -> Ném KeyNotFoundException với message "Like request not found".
        /// </summary>
        [Fact]
        public async Task UTCID05_RespondToLikeAsync_MatchWithNonPendingStatus_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            // Already Accepted - match action should fail
            SeedChatUser(1, fromPet.PetId, toPet.PetId, fromUserId, toUserId, "Accepted");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "match"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.RespondToLikeAsync(request));

            Assert.Contains("Like request not found", ex.Message);
        }

        /// <summary>
        /// UTCID06-09: Match action with null pet data
        /// -> Ném InvalidOperationException với message "Không tìm thấy thông tin pet hoặc user."
        /// </summary>
        [Fact]
        public async Task UTCID06_RespondToLikeAsync_MatchWithNullFromPet_ThrowsInvalidOperationException()
        {
            // Arrange
            SeedChatUser(1, null, 2, 1, 2, "Pending");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "match"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.RespondToLikeAsync(request));

            Assert.Contains("Không tìm thấy thông tin pet hoặc user", ex.Message);
        }

        /// <summary>
        /// UTCID07: Match action with null ToPet
        /// -> Ném InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID07_RespondToLikeAsync_MatchWithNullToPet_ThrowsInvalidOperationException()
        {
            // Arrange
            const int fromUserId = 1;
            SeedUser(fromUserId, "from@test.com", "From User");
            var fromPet = SeedPet(1, fromUserId, "From Pet");

            SeedChatUser(1, fromPet.PetId, null, fromUserId, 2, "Pending");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "match"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.RespondToLikeAsync(request));

            Assert.Contains("Không tìm thấy thông tin pet hoặc user", ex.Message);
        }

        /// <summary>
        /// UTCID08: Match action with null FromPet.UserId
        /// -> Ném InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID08_RespondToLikeAsync_MatchWithNullFromPetUserId_ThrowsInvalidOperationException()
        {
            // Arrange - Pet with null UserId
            var petWithNoUser = new Pet
            {
                PetId = 100,
                UserId = null,
                Name = "No Owner Pet",
                Gender = "Male",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Pets.Add(petWithNoUser);
            _context.SaveChanges();

            const int toUserId = 2;
            SeedUser(toUserId, "to@test.com", "To User");
            var toPet = SeedPet(2, toUserId, "To Pet");

            SeedChatUser(1, petWithNoUser.PetId, toPet.PetId, null, toUserId, "Pending");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "match"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.RespondToLikeAsync(request));

            Assert.Contains("Không tìm thấy thông tin pet hoặc user", ex.Message);
        }

        /// <summary>
        /// UTCID09: Match action with null ToPet.UserId
        /// -> Ném InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID09_RespondToLikeAsync_MatchWithNullToPetUserId_ThrowsInvalidOperationException()
        {
            // Arrange
            const int fromUserId = 1;
            SeedUser(fromUserId, "from@test.com", "From User");
            var fromPet = SeedPet(1, fromUserId, "From Pet");

            var petWithNoUser = new Pet
            {
                PetId = 100,
                UserId = null,
                Name = "No Owner Pet",
                Gender = "Male",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Pets.Add(petWithNoUser);
            _context.SaveChanges();

            SeedChatUser(1, fromPet.PetId, petWithNoUser.PetId, fromUserId, null, "Pending");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "match"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.RespondToLikeAsync(request));

            Assert.Contains("Không tìm thấy thông tin pet hoặc user", ex.Message);
        }

        /// <summary>
        /// UTCID10: Action="match", Status="Pending", all data valid
        /// -> Trả về object với status: "Accepted", isMatch: true, message: "It's a match!".
        /// </summary>
        [Fact]
        public async Task UTCID10_RespondToLikeAsync_MatchAction_ReturnsMatch()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            SeedChatUser(1, fromPet.PetId, toPet.PetId, fromUserId, toUserId, "Pending");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "match"
            };

            // Act
            var result = await _service.RespondToLikeAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var matchId = type.GetProperty("matchId")?.GetValue(result);
            var status = (string)type.GetProperty("status")!.GetValue(result)!;
            var isMatch = (bool)type.GetProperty("isMatch")!.GetValue(result)!;
            var message = (string)type.GetProperty("message")!.GetValue(result)!;

            Assert.NotNull(matchId);
            Assert.Equal("Accepted", status);
            Assert.True(isMatch);
            Assert.Equal("It's a match!", message);
        }

        /// <summary>
        /// UTCID11: Action="invalid" (not "match" or "pass")
        /// -> Ném ArgumentException với message "Invalid action. Use 'match' or 'pass'".
        /// </summary>
        [Fact]
        public async Task UTCID11_RespondToLikeAsync_InvalidAction_ThrowsArgumentException()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;

            SeedUser(fromUserId, "from@test.com", "From User");
            SeedUser(toUserId, "to@test.com", "To User");

            var fromPet = SeedPet(1, fromUserId, "From Pet");
            var toPet = SeedPet(2, toUserId, "To Pet");

            SeedChatUser(1, fromPet.PetId, toPet.PetId, fromUserId, toUserId, "Pending");

            var request = new RespondRequest
            {
                MatchId = 1,
                Action = "invalid"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.RespondToLikeAsync(request));

            Assert.Contains("Invalid action", ex.Message);
        }
    }
}
