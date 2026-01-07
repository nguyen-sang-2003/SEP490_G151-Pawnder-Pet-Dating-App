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
    public class GetLikesReceivedAsyncTest : IDisposable
    {
        private readonly Mock<IChatUserRepository> _mockChatUserRepo;
        private readonly Mock<IBlockRepository> _mockBlockRepo;
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly MatchService _service;

        public GetLikesReceivedAsyncTest()
        {
            _mockChatUserRepo = new Mock<IChatUserRepository>();
            _mockBlockRepo = new Mock<IBlockRepository>();
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"MatchServiceGetLikesDb_{Guid.NewGuid()}")
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

        private void SeedChatUser(int matchId, int fromPetId, int toPetId, int fromUserId, int toUserId, string status = "Pending")
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
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        private void SeedBlock(int fromUserId, int toUserId)
        {
            if (!_context.Blocks.Any(b => b.FromUserId == fromUserId && b.ToUserId == toUserId))
            {
                _context.Blocks.Add(new Block
                {
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    CreatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: PetId valid, null filter, User has multiple ChatUser records, mixed status (Pending + Accepted), 
        /// User is not blocked, Blocks don't exist
        /// -> Trả về IEnumerable<object> với Count > 1.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetLikesReceivedAsync_MultipleRecordsNoFilter_ReturnsMultipleResults()
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

            // Pending like from other user 1
            SeedChatUser(1, otherPet1.PetId, myPet.PetId, otherUserId1, userId, "Pending");
            // Accepted match with other user 2
            SeedChatUser(2, otherPet2.PetId, myPet.PetId, otherUserId2, userId, "Accepted");

            // Act
            var result = await _service.GetLikesReceivedAsync(userId, null);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.True(resultList.Count > 1);
        }

        /// <summary>
        /// UTCID02: PetId valid, provided filter (filter by petId), User has ChatUser records, 
        /// mixed status, User is not blocked, Blocks don't exist
        /// -> Trả về IEnumerable<object> với Count = 1.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetLikesReceivedAsync_FilterByPetId_ReturnsSingleResult()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId1 = 2;
            const int otherUserId2 = 3;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(otherUserId1, "other1@test.com", "Other User 1");
            SeedUser(otherUserId2, "other2@test.com", "Other User 2");

            var myPet1 = SeedPet(1, userId, "My Pet 1");
            var myPet2 = SeedPet(4, userId, "My Pet 2");
            var otherPet1 = SeedPet(2, otherUserId1, "Other Pet 1");
            var otherPet2 = SeedPet(3, otherUserId2, "Other Pet 2");

            // Pending like to myPet1
            SeedChatUser(1, otherPet1.PetId, myPet1.PetId, otherUserId1, userId, "Pending");
            // Pending like to myPet2 (should be filtered out)
            SeedChatUser(2, otherPet2.PetId, myPet2.PetId, otherUserId2, userId, "Pending");

            // Act - Filter by myPet1
            var result = await _service.GetLikesReceivedAsync(userId, myPet1.PetId);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
        }

        /// <summary>
        /// UTCID03: PetId valid, null filter, User has NO ChatUser records
        /// -> Trả về IEnumerable<object> với Count = 0 (empty).
        /// </summary>
        [Fact]
        public async Task UTCID03_GetLikesReceivedAsync_NoRecords_ReturnsEmptyList()
        {
            // Arrange
            const int userId = 1;

            SeedUser(userId, "user@test.com", "Test User");
            var myPet = SeedPet(1, userId, "My Pet");
            // No ChatUser records seeded

            // Act
            var result = await _service.GetLikesReceivedAsync(userId, null);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID04: PetId valid, null filter, User has ChatUser records, Blocks exist, User is blocked
        /// -> Trả về IEnumerable<object> với Count = 0 (blocked users filtered out).
        /// </summary>
        [Fact]
        public async Task UTCID04_GetLikesReceivedAsync_BlockedUsers_ReturnsEmptyList()
        {
            // Arrange
            const int userId = 1;
            const int blockedUserId = 2;

            SeedUser(userId, "user@test.com", "Test User");
            SeedUser(blockedUserId, "blocked@test.com", "Blocked User");

            var myPet = SeedPet(1, userId, "My Pet");
            var blockedPet = SeedPet(2, blockedUserId, "Blocked Pet");

            // Create a like from blocked user
            SeedChatUser(1, blockedPet.PetId, myPet.PetId, blockedUserId, userId, "Pending");

            // Block the user
            SeedBlock(userId, blockedUserId);

            // Act
            var result = await _service.GetLikesReceivedAsync(userId, null);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result); // Blocked user's likes should be filtered out
        }
    }
}
