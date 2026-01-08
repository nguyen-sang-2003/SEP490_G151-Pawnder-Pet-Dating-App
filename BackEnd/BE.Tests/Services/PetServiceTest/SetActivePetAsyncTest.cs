using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetServiceTest
{
    public class SetActivePetAsyncTest : IDisposable
    {
        private readonly Mock<IPetRepository> _mockPetRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetService _petService;

        public SetActivePetAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockPetRepository = new Mock<IPetRepository>();

            // Create real InMemory DbContext
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Khởi tạo service
            _petService = new PetService(
                _mockPetRepository.Object,
                _context
            );
        }

        public void Dispose()
        {
            _context?.Dispose();
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid pet exists, not deleted, has UserId
        /// Condition: PetId valid (exists), IsDeleted = FALSE, UserId has value, GetByIdAsync returns pet
        /// Expected: Return true and DeactivateOtherPetsAsync is called
        /// </summary>
        [Fact]
        public async Task UTCID01_SetActivePetAsync_ValidPetNotDeletedHasUserId_ReturnsTrueAndDeactivatesOthers()
        {
            // Arrange
            var pet = new Pet
            {
                PetId = 1,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = false,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(pet);

            _mockPetRepository
                .Setup(r => r.DeactivateOtherPetsAsync(1, 1, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _petService.SetActivePetAsync(1);

            // Assert
            Assert.True(result);
            _mockPetRepository.Verify(
                r => r.DeactivateOtherPetsAsync(1, 1, It.IsAny<CancellationToken>()), 
                Times.Once);
        }

        /// <summary>
        /// UTCID02: Abnormal case - Valid pet exists but is deleted
        /// Condition: PetId valid (exists), IsDeleted = TRUE, UserId has value, GetByIdAsync returns pet
        /// Expected: Return false and DeactivateOtherPetsAsync is never called
        /// </summary>
        [Fact]
        public async Task UTCID02_SetActivePetAsync_ValidPetButDeleted_ReturnsFalseAndNeverDeactivates()
        {
            // Arrange
            var pet = new Pet
            {
                PetId = 1,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = false,
                IsDeleted = true,  // Pet đã bị xóa
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(pet);

            // Act
            var result = await _petService.SetActivePetAsync(1);

            // Assert
            Assert.False(result);
            _mockPetRepository.Verify(
                r => r.DeactivateOtherPetsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), 
                Times.Never);
        }

        /// <summary>
        /// UTCID03: Normal case - Valid pet exists, not deleted, but UserId is null
        /// Condition: PetId valid (exists), IsDeleted = FALSE, UserId = null, GetByIdAsync returns pet
        /// Expected: Return true and DeactivateOtherPetsAsync is never called (no user to deactivate for)
        /// </summary>
        [Fact]
        public async Task UTCID03_SetActivePetAsync_ValidPetNullUserId_ReturnsTrueAndNeverDeactivates()
        {
            // Arrange
            var pet = new Pet
            {
                PetId = 1,
                UserId = null,  // UserId là null
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = false,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(pet);

            // Act
            var result = await _petService.SetActivePetAsync(1);

            // Assert
            Assert.True(result);
            _mockPetRepository.Verify(
                r => r.DeactivateOtherPetsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), 
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Abnormal case - PetId invalid (not exists)
        /// Condition: PetId invalid (not exists), GetByIdAsync returns null
        /// Expected: Return false and DeactivateOtherPetsAsync is never called
        /// </summary>
        [Fact]
        public async Task UTCID04_SetActivePetAsync_InvalidPetId_ReturnsFalseAndNeverDeactivates()
        {
            // Arrange
            _mockPetRepository
                .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Pet?)null);

            // Act
            var result = await _petService.SetActivePetAsync(999);

            // Assert
            Assert.False(result);
            _mockPetRepository.Verify(
                r => r.DeactivateOtherPetsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), 
                Times.Never);
        }

        #endregion
    }
}
