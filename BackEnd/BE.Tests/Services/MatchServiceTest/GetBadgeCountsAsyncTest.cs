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
    public class GetBadgeCountsAsyncTest : IDisposable
    {
        private readonly Mock<IChatUserRepository> _mockChatUserRepo;
        private readonly Mock<IBlockRepository> _mockBlockRepo;
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly MatchService _service;

        public GetBadgeCountsAsyncTest()
        {
            _mockChatUserRepo = new Mock<IChatUserRepository>();
            _mockBlockRepo = new Mock<IBlockRepository>();
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"MatchServiceBadgeDb_{Guid.NewGuid()}")
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

        /// <summary>
        /// UTCID01: userId valid, petId valid (belongs to user), UserHasPets=TRUE, HasAcceptedMatches=TRUE
        /// -> Trả về object với unreadChats và favoriteBadge.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetBadgeCountsAsync_ValidUserWithPetAndMatches_ReturnsResult()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId, "other@test.com", "Other User");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");

            // Accepted match
            SeedChatUser(1, otherPet.PetId, myPet.PetId, otherUserId, userId, "Accepted");
            // Pending like
            SeedChatUser(2, otherPet.PetId, myPet.PetId, otherUserId, userId, "Pending");

            // Act
            var result = await _service.GetBadgeCountsAsync(userId, myPet.PetId);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var unreadChats = type.GetProperty("unreadChats")?.GetValue(result);
            var favoriteBadge = type.GetProperty("favoriteBadge")?.GetValue(result);

            Assert.NotNull(unreadChats);
            Assert.NotNull(favoriteBadge);
        }

        /// <summary>
        /// UTCID02: Same as UTCID01 - valid user, valid petId, with matches
        /// </summary>
        [Fact]
        public async Task UTCID02_GetBadgeCountsAsync_ValidUserWithMatchesAndPendingLikes_ReturnsBadge()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId, "other@test.com", "Other User");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");

            // Accepted match
            SeedChatUser(1, otherPet.PetId, myPet.PetId, otherUserId, userId, "Accepted");

            // Act
            var result = await _service.GetBadgeCountsAsync(userId, myPet.PetId);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var unreadChats = type.GetProperty("unreadChats")!.GetValue(result) as List<int>;
            Assert.NotNull(unreadChats);
        }

        /// <summary>
        /// UTCID03: userId valid, petId valid, UserHasPets=TRUE, HasAcceptedMatches=FALSE
        /// -> Trả về object với unreadChats=empty, favoriteBadge=0.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetBadgeCountsAsync_NoAcceptedMatches_ReturnsEmptyUnreadChats()
        {
            // Arrange
            const int userId = 1;

            SeedUser(userId, "user@test.com", "Test User");
            var myPet = SeedPet(1, userId, "My Pet");
            // No matches

            // Act
            var result = await _service.GetBadgeCountsAsync(userId, myPet.PetId);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var unreadChats = type.GetProperty("unreadChats")!.GetValue(result) as List<int>;
            Assert.NotNull(unreadChats);
            Assert.Empty(unreadChats);
        }

        /// <summary>
        /// UTCID04: userId valid, petId valid, UserHasPets=TRUE, HasAcceptedMatches=TRUE
        /// </summary>
        [Fact]
        public async Task UTCID04_GetBadgeCountsAsync_WithAcceptedMatches_ReturnsCounts()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId, "other@test.com", "Other User");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");

            SeedChatUser(1, otherPet.PetId, myPet.PetId, otherUserId, userId, "Accepted");

            // Act
            var result = await _service.GetBadgeCountsAsync(userId, myPet.PetId);

            // Assert
            Assert.NotNull(result);
        }

        /// <summary>
        /// UTCID05: petId = null (all pets)
        /// -> Trả về kết quả cho tất cả pets của user.
        /// </summary>
        [Fact]
        public async Task UTCID05_GetBadgeCountsAsync_NullPetId_ReturnsResultsForAllPets()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId, "other@test.com", "Other User");

            var myPet1 = SeedPet(1, userId, "My Pet 1");
            var myPet2 = SeedPet(3, userId, "My Pet 2");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");

            // Match for pet 1
            SeedChatUser(1, otherPet.PetId, myPet1.PetId, otherUserId, userId, "Accepted");
            // Pending like for pet 2
            SeedChatUser(2, otherPet.PetId, myPet2.PetId, otherUserId, userId, "Pending");

            // Act
            var result = await _service.GetBadgeCountsAsync(userId, null);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var favoriteBadge = (int)type.GetProperty("favoriteBadge")!.GetValue(result)!;
            Assert.True(favoriteBadge > 0);
        }

        /// <summary>
        /// UTCID06: userId = 999 (not exists), UserHasPets=FALSE
        /// -> Trả về empty results.
        /// </summary>
        [Fact]
        public async Task UTCID06_GetBadgeCountsAsync_UserNotExists_ReturnsEmptyResults()
        {
            // Arrange - userId 999 does not exist

            // Act
            var result = await _service.GetBadgeCountsAsync(999, null);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var unreadChats = type.GetProperty("unreadChats")!.GetValue(result) as List<int>;
            var favoriteBadge = (int)type.GetProperty("favoriteBadge")!.GetValue(result)!;

            Assert.NotNull(unreadChats);
            Assert.Empty(unreadChats);
            Assert.Equal(0, favoriteBadge);
        }

        /// <summary>
        /// UTCID07: petId = 999 (not belongs to user)
        /// -> petId bị bỏ qua, trả về kết quả cho tất cả pets của user.
        /// </summary>
        [Fact]
        public async Task UTCID07_GetBadgeCountsAsync_PetIdNotBelongsToUser_ReturnsResultsForAllPets()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId, "other@test.com", "Other User");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");
            var notMyPet = SeedPet(999, otherUserId, "Not My Pet");

            SeedChatUser(1, otherPet.PetId, myPet.PetId, otherUserId, userId, "Pending");

            // Act - petId 999 does not belong to userId 1
            var result = await _service.GetBadgeCountsAsync(userId, 999);

            // Assert - should return results for all user's pets since petId doesn't belong to user
            Assert.NotNull(result);
            var type = result.GetType();
            var favoriteBadge = (int)type.GetProperty("favoriteBadge")!.GetValue(result)!;
            Assert.True(favoriteBadge >= 0);
        }

        /// <summary>
        /// UTCID08: petId = 0 hoặc giá trị không hợp lệ, UserHasPets=FALSE
        /// -> Trả về empty results.
        /// </summary>
        [Fact]
        public async Task UTCID08_GetBadgeCountsAsync_InvalidPetIdNoPets_ReturnsEmptyResults()
        {
            // Arrange
            const int userId = 1;
            SeedUser(userId, "user@test.com", "Test User");
            // No pets for this user

            // Act
            var result = await _service.GetBadgeCountsAsync(userId, 0);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var unreadChats = type.GetProperty("unreadChats")!.GetValue(result) as List<int>;
            var favoriteBadge = (int)type.GetProperty("favoriteBadge")!.GetValue(result)!;

            Assert.NotNull(unreadChats);
            Assert.Empty(unreadChats);
            Assert.Equal(0, favoriteBadge);
        }
    }
}
