using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetPhotoServiceTest
{
    public class GetPhotosByPetIdAsyncTest : IDisposable
    {
        private readonly Mock<IPetPhotoRepository> _mockPetPhotoRepository;
        private readonly Mock<IPhotoStorage> _mockPhotoStorage;
        private readonly PawnderDatabaseContext _context;
        private readonly PetPhotoService _petPhotoService;

        public GetPhotosByPetIdAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockPetPhotoRepository = new Mock<IPetPhotoRepository>();
            _mockPhotoStorage = new Mock<IPhotoStorage>();

            // Create real InMemory DbContext
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Khởi tạo service
            _petPhotoService = new PetPhotoService(
                _mockPetPhotoRepository.Object,
                _context,
                _mockPhotoStorage.Object
            );
        }

        public void Dispose()
        {
            _context?.Dispose();
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid petId, Pet IsDeleted=FALSE, has multiple photos
        /// Condition: PetId valid (exists), Pet IsDeleted=FALSE, Pet has photos (multiple), FindAsync returns pet
        /// Expected: Return IEnumerable<PetPhotoResponse> with items
        /// </summary>
        [Fact]
        public async Task UTCID01_GetPhotosByPetIdAsync_ValidPetWithMultiplePhotos_ReturnsPhotos()
        {
            // Arrange
            int petId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
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

            var photos = new List<PetPhotoResponse>
            {
                new PetPhotoResponse
                {
                    PhotoId = 1,
                    PetId = petId,
                    Url = "https://example.com/photo1.jpg",
                    IsPrimary = true,
                    SortOrder = 0
                },
                new PetPhotoResponse
                {
                    PhotoId = 2,
                    PetId = petId,
                    Url = "https://example.com/photo2.jpg",
                    IsPrimary = false,
                    SortOrder = 1
                }
            };

            _mockPetPhotoRepository
                .Setup(r => r.GetPhotosByPetIdAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(photos);

            // Act
            var result = await _petPhotoService.GetPhotosByPetIdAsync(petId);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);
            Assert.Equal("https://example.com/photo1.jpg", resultList[0].Url);
            Assert.True(resultList[0].IsPrimary);
        }

        /// <summary>
        /// UTCID02: Normal case - Valid petId, Pet IsDeleted=FALSE, has no photos
        /// Condition: PetId valid (exists), Pet IsDeleted=FALSE, Pet has no photos
        /// Expected: Return IEnumerable<PetPhotoResponse> empty
        /// </summary>
        [Fact]
        public async Task UTCID02_GetPhotosByPetIdAsync_ValidPetWithNoPhotos_ReturnsEmptyList()
        {
            // Arrange
            int petId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
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

            var emptyPhotos = new List<PetPhotoResponse>();

            _mockPetPhotoRepository
                .Setup(r => r.GetPhotosByPetIdAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(emptyPhotos);

            // Act
            var result = await _petPhotoService.GetPhotosByPetIdAsync(petId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: Abnormal case - PetId invalid (not exists)
        /// Condition: PetId invalid (not exists), FindAsync returns null
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID03_GetPhotosByPetIdAsync_PetNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int invalidPetId = 999;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petPhotoService.GetPhotosByPetIdAsync(invalidPetId));

            Assert.Contains("Không tìm thấy pet", exception.Message);
        }

        /// <summary>
        /// UTCID04: Abnormal case - Valid petId but Pet IsDeleted=TRUE
        /// Condition: PetId valid (exists), Pet IsDeleted=TRUE, FindAsync returns pet
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID04_GetPhotosByPetIdAsync_PetIsDeleted_ThrowsKeyNotFoundException()
        {
            // Arrange
            int petId = 1;

            var pet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "Buddy",
                Breed = "Golden Retriever",
                Gender = "Male",
                IsActive = true,
                IsDeleted = true,  // Pet đã bị xóa
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Pets.Add(pet);
            await _context.SaveChangesAsync();

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petPhotoService.GetPhotosByPetIdAsync(petId));

            Assert.Contains("Không tìm thấy pet", exception.Message);
        }

        #endregion
    }
}
