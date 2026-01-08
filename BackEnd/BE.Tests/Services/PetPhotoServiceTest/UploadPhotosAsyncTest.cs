using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetPhotoServiceTest
{
    public class UploadPhotosAsyncTest : IDisposable
    {
        private readonly Mock<IPetPhotoRepository> _mockPetPhotoRepository;
        private readonly Mock<IPhotoStorage> _mockPhotoStorage;
        private readonly PawnderDatabaseContext _context;
        private readonly PetPhotoService _petPhotoService;

        public UploadPhotosAsyncTest()
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

        private Mock<IFormFile> CreateMockFormFile(string fileName, string contentType = "image/jpeg")
        {
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns(fileName);
            mockFile.Setup(f => f.ContentType).Returns(contentType);
            mockFile.Setup(f => f.Length).Returns(1024);
            return mockFile;
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid petId, Pet IsDeleted=FALSE, Files valid, existing photo count=0, files.Count<=6
        /// Condition: PetId valid (exists), Pet IsDeleted=FALSE, Files has items (valid), Existing photo count=0, files.Count<=6
        /// Expected: Return IEnumerable<PetPhotoResponse> with uploaded photos
        /// </summary>
        [Fact]
        public async Task UTCID01_UploadPhotosAsync_ValidPetNoExistingPhotos_ReturnsUploadedPhotos()
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

            var mockFile = CreateMockFormFile("photo1.jpg");
            var files = new List<IFormFile> { mockFile.Object };

            _mockPetPhotoRepository
                .Setup(r => r.GetPhotoCountByPetIdAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(0);  // Existing photo count = 0

            _mockPetPhotoRepository
                .Setup(r => r.GetMaxSortOrderAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((int?)null);

            _mockPhotoStorage
                .Setup(s => s.UploadAsync(petId, It.IsAny<IFormFile>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(("https://example.com/photo1.jpg", "public_id_1"));

            _mockPetPhotoRepository
                .Setup(r => r.AddAsync(It.IsAny<PetPhoto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((PetPhoto p, CancellationToken ct) => p);

            // Act
            var result = await _petPhotoService.UploadPhotosAsync(petId, files);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.Equal("https://example.com/photo1.jpg", resultList[0].Url);
        }

        /// <summary>
        /// UTCID02: Abnormal case - PetId invalid (not exists)
        /// Condition: PetId invalid (not exists), FindAsync returns null
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID02_UploadPhotosAsync_PetNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int invalidPetId = 999;

            var mockFile = CreateMockFormFile("photo1.jpg");
            var files = new List<IFormFile> { mockFile.Object };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petPhotoService.UploadPhotosAsync(invalidPetId, files));

            Assert.Contains("Không tìm thấy pet", exception.Message);
        }

        /// <summary>
        /// UTCID03: Abnormal case - Valid petId but Pet IsDeleted=TRUE
        /// Condition: PetId valid (exists), Pet IsDeleted=TRUE, FindAsync returns pet
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID03_UploadPhotosAsync_PetIsDeleted_ThrowsKeyNotFoundException()
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

            var mockFile = CreateMockFormFile("photo1.jpg");
            var files = new List<IFormFile> { mockFile.Object };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petPhotoService.UploadPhotosAsync(petId, files));

            Assert.Contains("Không tìm thấy pet", exception.Message);
        }

        /// <summary>
        /// UTCID04: Normal case - Valid petId, Pet IsDeleted=FALSE, Files valid, existing < MaxPhotosPerPet
        /// Condition: PetId valid (exists), Pet IsDeleted=FALSE, Files has items (valid), Existing photo count < MaxPhotosPerPet, files.Count<=6
        /// Expected: Return IEnumerable<PetPhotoResponse> with uploaded photos
        /// </summary>
        [Fact]
        public async Task UTCID04_UploadPhotosAsync_ValidPetWithExistingPhotos_ReturnsUploadedPhotos()
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

            var mockFile1 = CreateMockFormFile("photo1.jpg");
            var mockFile2 = CreateMockFormFile("photo2.jpg");
            var files = new List<IFormFile> { mockFile1.Object, mockFile2.Object };

            _mockPetPhotoRepository
                .Setup(r => r.GetPhotoCountByPetIdAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(2);  // Existing photo count = 2 (< MaxPhotosPerPet = 6)

            _mockPetPhotoRepository
                .Setup(r => r.GetMaxSortOrderAsync(petId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            _mockPhotoStorage
                .Setup(s => s.UploadAsync(petId, It.IsAny<IFormFile>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(("https://example.com/photo.jpg", "public_id"));

            _mockPetPhotoRepository
                .Setup(r => r.AddAsync(It.IsAny<PetPhoto>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((PetPhoto p, CancellationToken ct) => p);

            // Act
            var result = await _petPhotoService.UploadPhotosAsync(petId, files);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);
        }

        #endregion
    }
}
