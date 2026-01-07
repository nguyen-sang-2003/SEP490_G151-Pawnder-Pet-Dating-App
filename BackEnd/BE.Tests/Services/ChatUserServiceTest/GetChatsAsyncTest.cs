using BE.Models;
using BE.Repositories;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatUserServiceTest
{
    public class GetChatsAsyncTest : IDisposable
    {
        private readonly PawnderDatabaseContext _context;
        private readonly ChatUserRepository _repository;

        public GetChatsAsyncTest()
        {
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatUserGetChatsDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _repository = new ChatUserRepository(_context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId, string email)
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = email,
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

        private void SeedChatUser(int matchId, int fromPetId, int toPetId, string status = "Accepted")
        {
            if (!_context.ChatUsers.Any(c => c.MatchId == matchId))
            {
                _context.ChatUsers.Add(new ChatUser
                {
                    MatchId = matchId,
                    FromPetId = fromPetId,
                    ToPetId = toPetId,
                    Status = status,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: userId=1 (valid, exists), petId=null, UserHasPets=TRUE, HasChats=TRUE
        /// -> Trả về IEnumerable<object> (not empty) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetChatsAsync_ValidUserWithChats_ReturnsNonEmptyList()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;
            SeedUser(userId, "user1@test.com");
            SeedUser(otherUserId, "user2@test.com");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");
            SeedChatUser(1, myPet.PetId, otherPet.PetId, "Accepted");

            // Act
            var result = await _repository.GetChatsAsync(userId, null);

            // Assert
            var resultList = result.ToList();
            Assert.NotEmpty(resultList);
            Assert.Single(resultList);

            var firstChat = resultList[0];
            var type = firstChat.GetType();

            // Verify response properties
            Assert.NotNull(type.GetProperty("matchId")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("fromPetId")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("toPetId")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("fromPetName")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("toPetName")!.GetValue(firstChat));
            Assert.Equal("Accepted", (string)type.GetProperty("status")!.GetValue(firstChat)!);
            Assert.NotNull(type.GetProperty("createdAt")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("fromPet")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("toPet")!.GetValue(firstChat));
        }

        /// <summary>
        /// UTCID02: userId=1 (valid, exists), petId=null, UserHasPets=TRUE, HasChats=FALSE
        /// -> Trả về IEnumerable<object> (empty).
        /// </summary>
        [Fact]
        public async Task UTCID02_GetChatsAsync_ValidUserWithPetsNoChats_ReturnsEmptyList()
        {
            // Arrange
            const int userId = 1;
            SeedUser(userId, "user1@test.com");
            SeedPet(1, userId, "My Pet");
            // No chats seeded

            // Act
            var result = await _repository.GetChatsAsync(userId, null);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: userId=1 (valid, exists), petId=null, UserHasPets=FALSE
        /// -> Trả về IEnumerable<object> (empty).
        /// </summary>
        [Fact]
        public async Task UTCID03_GetChatsAsync_ValidUserWithoutPets_ReturnsEmptyList()
        {
            // Arrange
            const int userId = 1;
            SeedUser(userId, "user1@test.com");
            // No pets seeded

            // Act
            var result = await _repository.GetChatsAsync(userId, null);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID04: userId=1 (valid, exists), petId=1 (valid, belongs to user), 
        /// UserHasPets=TRUE, HasChats=TRUE, petId belongs to user=TRUE
        /// -> Trả về IEnumerable<object> (not empty) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetChatsAsync_ValidUserWithPetIdFilter_ReturnsNonEmptyList()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;
            SeedUser(userId, "user1@test.com");
            SeedUser(otherUserId, "user2@test.com");

            var myPet = SeedPet(1, userId, "My Pet");
            var otherPet = SeedPet(2, otherUserId, "Other Pet");
            SeedChatUser(1, myPet.PetId, otherPet.PetId, "Accepted");

            // Act
            var result = await _repository.GetChatsAsync(userId, myPet.PetId);

            // Assert
            var resultList = result.ToList();
            Assert.NotEmpty(resultList);
            Assert.Single(resultList);

            var firstChat = resultList[0];
            var type = firstChat.GetType();

            // Verify response properties
            Assert.NotNull(type.GetProperty("matchId")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("fromPetId")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("toPetId")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("fromPetName")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("toPetName")!.GetValue(firstChat));
            Assert.Equal("Accepted", (string)type.GetProperty("status")!.GetValue(firstChat)!);
            Assert.NotNull(type.GetProperty("createdAt")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("fromPet")!.GetValue(firstChat));
            Assert.NotNull(type.GetProperty("toPet")!.GetValue(firstChat));
        }

        /// <summary>
        /// UTCID05: userId=1 (valid, exists), petId=999 (valid, not belongs to user),
        /// UserHasPets=TRUE, petId belongs to user=FALSE
        /// -> Ném ArgumentException với message "Pet không thuộc người dùng này."
        /// </summary>
        [Fact]
        public async Task UTCID05_GetChatsAsync_PetNotBelongsToUser_ThrowsArgumentException()
        {
            // Arrange
            const int userId = 1;
            const int otherUserId = 2;
            SeedUser(userId, "user1@test.com");
            SeedUser(otherUserId, "user2@test.com");

            SeedPet(1, userId, "My Pet"); // User's pet
            var otherPet = SeedPet(999, otherUserId, "Other Pet"); // Another user's pet

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.GetChatsAsync(userId, otherPet.PetId));

            Assert.Equal("Pet không thuộc người dùng này.", ex.Message);
        }

        /// <summary>
        /// UTCID06: userId invalid (0, -1, int.MaxValue, int.MinValue), petId=null, UserHasPets=FALSE
        /// -> Trả về IEnumerable<object> (empty).
        /// </summary>
        [Fact]
        public async Task UTCID06_GetChatsAsync_InvalidUserId_ReturnsEmptyList()
        {
            // Arrange
            var invalidUserIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var userId in invalidUserIds)
            {
                // Act
                var result = await _repository.GetChatsAsync(userId, null);

                // Assert
                Assert.NotNull(result);
                Assert.Empty(result);
            }
        }

        /// <summary>
        /// UTCID07: userId=1, petId invalid (0, -1, int.MaxValue, int.MinValue),
        /// UserHasPets=TRUE, petId belongs to user=FALSE
        /// -> Ném ArgumentException với message "Pet không thuộc người dùng này."
        /// </summary>
        [Fact]
        public async Task UTCID07_GetChatsAsync_InvalidPetId_ThrowsArgumentException()
        {
            // Arrange
            const int userId = 1;
            SeedUser(userId, "user1@test.com");
            SeedPet(1, userId, "My Pet"); // User has pets

            var invalidPetIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var petId in invalidPetIds)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<ArgumentException>(
                    () => _repository.GetChatsAsync(userId, petId));

                Assert.Equal("Pet không thuộc người dùng này.", ex.Message);
            }
        }
    }
}
