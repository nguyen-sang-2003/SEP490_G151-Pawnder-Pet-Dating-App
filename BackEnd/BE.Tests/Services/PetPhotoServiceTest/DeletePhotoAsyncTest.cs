using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetPhotoServiceTest
{
    public class DeletePhotoAsyncTest : IDisposable
    {
        private readonly Mock<IPetPhotoRepository> _mockPetPhotoRepository;
        private readonly Mock<IPhotoStorage> _mockPhotoStorage;
        private readonly PawnderDatabaseContext _context;
        private readonly PetPhotoService _petPhotoService;

        public DeletePhotoAsyncTest()
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
        /// UTCID01: Normal case - Valid photoId, IsDeleted=FALSE, hard=FALSE, PublicId has value
        /// Condition: PhotoId valid (exists), Pet IsDeleted=FALSE, Hard delete parameter=FALSE, PublicId has value, GetByIdAsync returns photo
        /// Expected: Return TRUE (soft delete only)
        /// </summary>
        [Fact]
        public async Task UTCID01_DeletePhotoAsync_ValidPhotoSoftDelete_ReturnsTrue()
        {
            // Arrange
            int photoId = 1;

            var photo = new PetPhoto
            {
                PhotoId = photoId,
                PetId = 1,
                ImageUrl = "https://example.com/photo1.jpg",
                PublicId = "public_id_1",
                IsPrimary = true,
                SortOrder = 0,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockPetPhotoRepository
                .Setup(r => r.GetByIdAsync(photoId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(photo);

            _mockPetPhotoRepository
                .Setup(r => r.UpdateAsync(It.IsAny<PetPhoto>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _petPhotoService.DeletePhotoAsync(photoId, hard: false);

            // Assert
            Assert.True(result);
            _mockPhotoStorage.Verify(s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID02: Normal case - Valid photoId, IsDeleted=FALSE, PublicId null or empty
        /// Condition: PhotoId valid (exists), Pet IsDeleted=FALSE, PublicId null or empty, GetByIdAsync returns photo
        /// Expected: Return TRUE
        /// </summary>
        [Fact]
        public async Task UTCID02_DeletePhotoAsync_ValidPhotoEmptyPublicId_ReturnsTrue()
        {
            // Arrange
            int photoId = 1;

            var photo = new PetPhoto
            {
                PhotoId = photoId,
                PetId = 1,
                ImageUrl = "https://example.com/photo1.jpg",
                PublicId = null,  // PublicId null
                IsPrimary = true,
                SortOrder = 0,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockPetPhotoRepository
                .Setup(r => r.GetByIdAsync(photoId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(photo);

            _mockPetPhotoRepository
                .Setup(r => r.UpdateAsync(It.IsAny<PetPhoto>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _petPhotoService.DeletePhotoAsync(photoId, hard: true);

            // Assert
            Assert.True(result);
            _mockPhotoStorage.Verify(s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID03: Abnormal case - PhotoId invalid (not exists)
        /// Condition: PhotoId invalid (not exists), GetByIdAsync returns null
        /// Expected: Return FALSE
        /// </summary>
        [Fact]
        public async Task UTCID03_DeletePhotoAsync_PhotoNotFound_ReturnsFalse()
        {
            // Arrange
            int invalidPhotoId = 999;

            _mockPetPhotoRepository
                .Setup(r => r.GetByIdAsync(invalidPhotoId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((PetPhoto?)null);

            // Act
            var result = await _petPhotoService.DeletePhotoAsync(invalidPhotoId, hard: true);

            // Assert
            Assert.False(result);
        }

        /// <summary>
        /// UTCID04: Abnormal case - Valid photoId but IsDeleted=TRUE (photo already deleted)
        /// Condition: PhotoId valid (exists), Pet IsDeleted=TRUE, GetByIdAsync returns photo
        /// Expected: Return FALSE
        /// </summary>
        [Fact]
        public async Task UTCID04_DeletePhotoAsync_PhotoAlreadyDeleted_ReturnsFalse()
        {
            // Arrange
            int photoId = 1;

            var photo = new PetPhoto
            {
                PhotoId = photoId,
                PetId = 1,
                ImageUrl = "https://example.com/photo1.jpg",
                PublicId = "public_id_1",
                IsPrimary = true,
                SortOrder = 0,
                IsDeleted = true,  // Photo đã bị xóa
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockPetPhotoRepository
                .Setup(r => r.GetByIdAsync(photoId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(photo);

            // Act
            var result = await _petPhotoService.DeletePhotoAsync(photoId, hard: false);

            // Assert
            Assert.False(result);
        }

        #endregion
    }
}
