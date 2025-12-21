using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetServiceTest
{
    public class GetPetsForMatchingAsyncTest : IDisposable
    {
        private readonly Mock<IPetRepository> _mockPetRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetService _service;

        public GetPetsForMatchingAsyncTest()
        {
            _mockPetRepository = new Mock<IPetRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PetForMatchingDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            _service = new PetService(
                _mockPetRepository.Object,
                _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId)
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = $"user{userId}@test.com",
                    FullName = $"Test User {userId}",
                    PasswordHash = "hash",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                });
                _context.SaveChanges();
            }
        }

        private void SeedPet(int petId, int userId, bool isActive = true, bool isDeleted = false)
        {
            if (!_context.Pets.Any(p => p.PetId == petId))
            {
                _context.Pets.Add(new Pet
                {
                    PetId = petId,
                    UserId = userId,
                    Name = $"Pet{petId}",
                    IsActive = isActive,
                    IsDeleted = isDeleted,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                });
                _context.SaveChanges();
            }
        }

        private void SeedBlock(int fromUserId, int toUserId)
        {
            _context.Blocks.Add(new Block
            {
                FromUserId = fromUserId,
                ToUserId = toUserId,
                CreatedAt = DateTime.Now
            });
            _context.SaveChanges();
        }

        private void SeedChatUser(int matchId, int fromPetId, int toPetId, string status = "Pending")
        {
            _context.ChatUsers.Add(new ChatUser
            {
                MatchId = matchId,
                FromPetId = fromPetId,
                ToPetId = toPetId,
                Status = status,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            });
            _context.SaveChanges();
        }

        /// <summary>
        /// UTCID01: Valid userId (exists), User has pets, User has blocks, Single pet available
        /// Expected: Returns IEnumerable<object> with count = 1
        /// </summary>
        [Fact]
        public async Task UTCID01_GetPetsForMatchingAsync_ValidUserWithBlocksSinglePetAvailable_ReturnsSinglePet()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            // Seed user and their pet
            SeedUser(userId);
            SeedPet(1, userId, isActive: true);

            // Seed another user who is blocked
            SeedUser(2);
            SeedPet(2, 2, isActive: true);
            SeedBlock(userId, 2);

            // Seed third user (not blocked, available for matching)
            SeedUser(3);
            SeedPet(3, 3, isActive: true);

            var expectedPets = new List<object>
            {
                new
                {
                    PetId = 3,
                    Name = "Pet3",
                    IsActive = true
                }
            };

            _mockPetRepository
                .Setup(r => r.GetPetsForMatchingAsync(
                    userId,
                    It.IsAny<List<int>>(),
                    It.Is<List<int>>(list => list.Contains(2)),
                    cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsForMatchingAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID02: Valid userId (exists), User has pets, No blocks, Single pet available
        /// Expected: Returns IEnumerable<object> with count = 1
        /// </summary>
        [Fact]
        public async Task UTCID02_GetPetsForMatchingAsync_ValidUserNoBlocksSinglePetAvailable_ReturnsSinglePet()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            // Seed user and their pet
            SeedUser(userId);
            SeedPet(1, userId, isActive: true);

            // Seed another user (available for matching)
            SeedUser(2);
            SeedPet(2, 2, isActive: true);

            var expectedPets = new List<object>
            {
                new
                {
                    PetId = 2,
                    Name = "Pet2",
                    IsActive = true
                }
            };

            _mockPetRepository
                .Setup(r => r.GetPetsForMatchingAsync(
                    userId,
                    It.IsAny<List<int>>(),
                    It.IsAny<List<int>>(),
                    cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsForMatchingAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID03: Valid userId (exists), User has pets, User has blocks, Single pet available
        /// Expected: Returns IEnumerable<object> with count = 1
        /// </summary>
        [Fact]
        public async Task UTCID03_GetPetsForMatchingAsync_ValidUserWithBlocksAndChatHistory_ReturnsSinglePet()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            // Seed users and pets
            SeedUser(userId);
            SeedPet(1, userId, isActive: true);

            SeedUser(2);
            SeedPet(2, 2, isActive: true);
            SeedBlock(userId, 2); // Block user 2

            SeedUser(3);
            SeedPet(3, 3, isActive: true);

            // User 1 already sent a like to user 3 (they should be excluded)
            SeedChatUser(1, 1, 3);

            SeedUser(4);
            SeedPet(4, 4, isActive: true); // Available for matching

            var expectedPets = new List<object>
            {
                new
                {
                    PetId = 4,
                    Name = "Pet4",
                    IsActive = true
                }
            };

            _mockPetRepository
                .Setup(r => r.GetPetsForMatchingAsync(
                    userId,
                    It.Is<List<int>>(list => list.Contains(3)), // Already matched with user 3
                    It.Is<List<int>>(list => list.Contains(2)), // Blocked user 2
                    cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsForMatchingAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID04: Valid userId (exists), User has pets, User has blocks, Multiple pets available
        /// Expected: Returns IEnumerable<object> with count > 1
        /// </summary>
        [Fact]
        public async Task UTCID04_GetPetsForMatchingAsync_ValidUserWithBlocksMultiplePetsAvailable_ReturnsMultiplePets()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            // Seed user and their pet
            SeedUser(userId);
            SeedPet(1, userId, isActive: true);

            // Seed blocked user
            SeedUser(2);
            SeedPet(2, 2, isActive: true);
            SeedBlock(userId, 2);

            // Seed multiple available users
            SeedUser(3);
            SeedPet(3, 3, isActive: true);

            SeedUser(4);
            SeedPet(4, 4, isActive: true);

            SeedUser(5);
            SeedPet(5, 5, isActive: true);

            var expectedPets = new List<object>
            {
                new { PetId = 3, Name = "Pet3", IsActive = true },
                new { PetId = 4, Name = "Pet4", IsActive = true },
                new { PetId = 5, Name = "Pet5", IsActive = true }
            };

            _mockPetRepository
                .Setup(r => r.GetPetsForMatchingAsync(
                    userId,
                    It.IsAny<List<int>>(),
                    It.Is<List<int>>(list => list.Contains(2)),
                    cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsForMatchingAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.True(resultList.Count > 1);
            Assert.Equal(3, resultList.Count);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID05: Valid userId (exists), User has pets, User has blocks, No pets available (all blocked/matched)
        /// Expected: Returns IEnumerable<object> with count = 0
        /// </summary>
        [Fact]
        public async Task UTCID05_GetPetsForMatchingAsync_ValidUserAllBlockedOrMatched_ReturnsEmptyList()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            // Seed user and their pet
            SeedUser(userId);
            SeedPet(1, userId, isActive: true);

            // Seed blocked user
            SeedUser(2);
            SeedPet(2, 2, isActive: true);
            SeedBlock(userId, 2);

            // Seed user already matched
            SeedUser(3);
            SeedPet(3, 3, isActive: true);
            SeedChatUser(1, 1, 3);

            var expectedPets = new List<object>(); // Empty - all are blocked or matched

            _mockPetRepository
                .Setup(r => r.GetPetsForMatchingAsync(
                    userId,
                    It.Is<List<int>>(list => list.Contains(3)),
                    It.Is<List<int>>(list => list.Contains(2)),
                    cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsForMatchingAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID06: Invalid userId (not exists), User has no pets, No blocks
        /// Expected: Returns IEnumerable<object> with count = 0
        /// </summary>
        [Fact]
        public async Task UTCID06_GetPetsForMatchingAsync_InvalidUserIdNotExists_ReturnsEmptyList()
        {
            // Arrange
            int userId = 999; // Non-existent user
            var cancellationToken = default(CancellationToken);

            // No data seeded for this user

            var expectedPets = new List<object>();

            _mockPetRepository
                .Setup(r => r.GetPetsForMatchingAsync(
                    userId,
                    It.IsAny<List<int>>(),
                    It.IsAny<List<int>>(),
                    cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsForMatchingAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }
    }
}
