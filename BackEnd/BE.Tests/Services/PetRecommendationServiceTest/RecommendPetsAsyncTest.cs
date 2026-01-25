using BE.Models;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetRecommendationServiceTest
{
    public class RecommendPetsAsyncTest : IDisposable
    {
        private readonly Mock<DistanceService> _mockDistanceService;
        private readonly PawnderDatabaseContext _context;
        private readonly PetRecommendationService _petRecommendationService;

        public RecommendPetsAsyncTest()
        {
            // Create real InMemory DbContext
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Setup mock DistanceService
            _mockDistanceService = new Mock<DistanceService>(_context);

            // Khởi tạo service
            _petRecommendationService = new PetRecommendationService(
                _context,
                _mockDistanceService.Object
            );
        }

        public void Dispose()
        {
            _context?.Dispose();
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid userId, has preferences, available pets > 0, has matched before
        /// Condition: UserId valid (exists), User has preferences, Available pets for matching > 0, User has matched/chatted before
        /// Expected: Return object (with data)
        /// </summary>
        [Fact]
        public async Task UTCID01_RecommendPetsAsync_ValidUserWithPreferencesAndMatches_ReturnsData()
        {
            // Arrange
            int userId = 1;

            var attribute = new BE.Models.Attribute
            {
                AttributeId = 1,
                Name = "Color",
                TypeValue = "option",
                Percent = 50,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Attributes.Add(attribute);

            var user = new User
            {
                UserId = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Gender = "Male",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Users.Add(user);

            var preference = new UserPreference
            {
                UserId = userId,
                AttributeId = 1,
                OptionId = 1,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Attribute = attribute
            };
            _context.UserPreferences.Add(preference);

            // Create another user with a pet
            var otherUser = new User
            {
                UserId = 2,
                FullName = "Other User",
                Email = "other@example.com",
                PasswordHash = "hashedpassword",
                Gender = "Female",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Users.Add(otherUser);

            var pet = new Pet
            {
                PetId = 1,
                UserId = 2,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);

            await _context.SaveChangesAsync();

            // Act
            var result = await _petRecommendationService.RecommendPetsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.NotNull(resultType.GetProperty("data")?.GetValue(result));
            Assert.True((bool)(resultType.GetProperty("hasPreferences")?.GetValue(result) ?? false));
        }

        /// <summary>
        /// UTCID02: Normal case - Valid userId, no preferences, available pets > 0
        /// Condition: UserId valid (exists), User has no preferences, Available pets for matching > 0
        /// Expected: Return object (with data) - pets without filtering
        /// </summary>
        [Fact]
        public async Task UTCID02_RecommendPetsAsync_ValidUserNoPreferences_ReturnsData()
        {
            // Arrange
            int userId = 1;

            var user = new User
            {
                UserId = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Gender = "Male",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Users.Add(user);

            // Create another user with a pet
            var otherUser = new User
            {
                UserId = 2,
                FullName = "Other User",
                Email = "other@example.com",
                PasswordHash = "hashedpassword",
                Gender = "Female",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Users.Add(otherUser);

            var pet = new Pet
            {
                PetId = 1,
                UserId = 2,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);

            await _context.SaveChangesAsync();

            // Act
            var result = await _petRecommendationService.RecommendPetsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            Assert.NotNull(resultType.GetProperty("data")?.GetValue(result));
            Assert.False((bool)(resultType.GetProperty("hasPreferences")?.GetValue(result) ?? true));
        }

        /// <summary>
        /// UTCID03: Abnormal case - UserId invalid (not exists)
        /// Condition: UserId invalid (not exists), Users returns null
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID03_RecommendPetsAsync_UserNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int invalidUserId = 999;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petRecommendationService.RecommendPetsAsync(invalidUserId));

            Assert.Contains("Không tìm thấy người dùng", exception.Message);
        }

        /// <summary>
        /// UTCID04: Normal case - Valid userId, has preferences, has available pets, has blocked users
        /// Condition: UserId valid (exists), User has preferences, Available pets for matching > 0, User has blocked some users
        /// Expected: Return object (with data) - excluding blocked users
        /// </summary>
        [Fact]
        public async Task UTCID04_RecommendPetsAsync_ValidUserWithBlockedUsers_ReturnsDataExcludingBlocked()
        {
            // Arrange
            int userId = 1;

            var attribute = new BE.Models.Attribute
            {
                AttributeId = 1,
                Name = "Breed",
                TypeValue = "option",
                Percent = 30,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Attributes.Add(attribute);

            var user = new User
            {
                UserId = userId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Gender = "Male",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Users.Add(user);

            var preference = new UserPreference
            {
                UserId = userId,
                AttributeId = 1,
                OptionId = 1,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Attribute = attribute
            };
            _context.UserPreferences.Add(preference);

            // Create two other users with pets
            var otherUser1 = new User
            {
                UserId = 2,
                FullName = "Other User 1",
                Email = "other1@example.com",
                PasswordHash = "hashedpassword",
                Gender = "Female",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Users.Add(otherUser1);

            var otherUser2 = new User
            {
                UserId = 3,
                FullName = "Other User 2",
                Email = "other2@example.com",
                PasswordHash = "hashedpassword",
                Gender = "Male",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Users.Add(otherUser2);

            var pet1 = new Pet
            {
                PetId = 1,
                UserId = 2,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet1);

            var pet2 = new Pet
            {
                PetId = 2,
                UserId = 3,
                Name = "Max",
                Breed = "Labrador",
                Gender = "Male",
                IsActive = true,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet2);

            // Block user 2
            var block = new Block
            {
                FromUserId = userId,
                ToUserId = 2,
                CreatedAt = DateTime.Now
            };
            _context.Blocks.Add(block);

            await _context.SaveChangesAsync();

            // Act
            var result = await _petRecommendationService.RecommendPetsAsync(userId);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var data = resultType.GetProperty("data")?.GetValue(result) as IEnumerable<object>;
            Assert.NotNull(data);
            // Should only return pet2 (from user 3), not pet1 (from blocked user 2)
            Assert.Single(data);
        }

        #endregion
    }
}
