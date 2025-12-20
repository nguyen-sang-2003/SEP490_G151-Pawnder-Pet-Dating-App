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
    public class GetStatsAsyncTest : IDisposable
    {
        private readonly Mock<IChatUserRepository> _mockChatUserRepo;
        private readonly Mock<IBlockRepository> _mockBlockRepo;
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly MatchService _service;

        public GetStatsAsyncTest()
        {
            _mockChatUserRepo = new Mock<IChatUserRepository>();
            _mockBlockRepo = new Mock<IBlockRepository>();
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"MatchServiceGetStatsDb_{Guid.NewGuid()}")
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
        /// UTCID01: UserId valid, User has pets=yes, User's pets have matches=yes,
        /// ChatUser.Status=Accepted (match) + Pending (like), ChatUser.IsDeleted=FALSE
        /// -> Trả về object với matches > 0, likes > 0.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetStatsAsync_HasMatchesAndLikes_ReturnsPositiveCounts()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId1 = 2;
            const int otherUserId2 = 3;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId1, "other1@test.com", "Other User 1");
            SeedUser(otherUserId2, "other2@test.com", "Other User 2");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet1 = SeedPet(2, otherUserId1, "Other Pet 1");
            var otherPet2 = SeedPet(3, otherUserId2, "Other Pet 2");

            // Accepted match (match count)
            SeedChatUser(1, otherPet1.PetId, myPet.PetId, otherUserId1, userId, "Accepted");
            // Pending like (likes count)
            SeedChatUser(2, otherPet2.PetId, myPet.PetId, otherUserId2, userId, "Pending");

            // Act
            var result = await _service.GetStatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var matches = (int)type.GetProperty("matches")!.GetValue(result)!;
            var likes = (int)type.GetProperty("likes")!.GetValue(result)!;

            Assert.True(matches > 0);
            Assert.True(likes > 0);
        }

        /// <summary>
        /// UTCID02: UserId valid, User has pets=yes, User's pets have matches=yes,
        /// ChatUser.Status=Accepted (match only), ChatUser.IsDeleted=FALSE
        /// -> Trả về object với matches > 0, likes = 0.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetStatsAsync_HasMatchesNoLikes_ReturnsMatchesOnlyPositive()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId, "other@test.com", "Other User");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");

            // Only Accepted match (no pending likes)
            SeedChatUser(1, otherPet.PetId, myPet.PetId, otherUserId, userId, "Accepted");

            // Act
            var result = await _service.GetStatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var matches = (int)type.GetProperty("matches")!.GetValue(result)!;
            var likes = (int)type.GetProperty("likes")!.GetValue(result)!;

            Assert.True(matches > 0);
            Assert.Equal(0, likes);
        }

        /// <summary>
        /// UTCID03: UserId valid, User has pets=yes, User's pets have no matches,
        /// but has Pending likes, ChatUser.IsDeleted=FALSE
        /// -> Trả về object với matches = 0, likes > 0.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetStatsAsync_NoMatchesHasLikes_ReturnsLikesOnlyPositive()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId, "other@test.com", "Other User");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");

            // Only Pending like (no accepted matches)
            SeedChatUser(1, otherPet.PetId, myPet.PetId, otherUserId, userId, "Pending");

            // Act
            var result = await _service.GetStatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var matches = (int)type.GetProperty("matches")!.GetValue(result)!;
            var likes = (int)type.GetProperty("likes")!.GetValue(result)!;

            Assert.Equal(0, matches);
            Assert.True(likes > 0);
        }

        /// <summary>
        /// UTCID04: UserId valid, User has no pets
        /// -> Trả về object với matches = 0, likes = 0.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetStatsAsync_NoPets_ReturnsZeroCounts()
        {
            // Arrange
            const int userId = 1;

            SeedUser(userId, "user@test.com", "Test User");
            // No pets seeded for this user

            // Act
            var result = await _service.GetStatsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var matches = (int)type.GetProperty("matches")!.GetValue(result)!;
            var likes = (int)type.GetProperty("likes")!.GetValue(result)!;

            Assert.Equal(0, matches);
            Assert.Equal(0, likes);
        }
    }
}
