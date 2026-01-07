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
    public class ReorderPhotosAsyncTest : IDisposable
    {
        private readonly Mock<IPetPhotoRepository> _mockPetPhotoRepository;
        private readonly Mock<IPhotoStorage> _mockPhotoStorage;
        private readonly PawnderDatabaseContext _context;
        private readonly PetPhotoService _petPhotoService;

        public ReorderPhotosAsyncTest()
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
        /// UTCID01: Normal case - Valid items, all PhotoIds exist in DB, all photos IsDeleted=false, matches count
        /// Condition: Items has valid items, All PhotoIds exist in DB, All photos IsDeleted=false, Items count matches photos count
        /// Expected: Return TRUE
        /// </summary>
        [Fact]
        public async Task UTCID01_ReorderPhotosAsync_ValidItemsAllPhotosExist_ReturnsTrue()
        {
            // Arrange
            var photo1 = new PetPhoto
            {
                PhotoId = 1,
                PetId = 1,
                ImageUrl = "https://example.com/photo1.jpg",
                PublicId = "public_id_1",
                IsPrimary = true,
                SortOrder = 0,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var photo2 = new PetPhoto
            {
                PhotoId = 2,
                PetId = 1,
                ImageUrl = "https://example.com/photo2.jpg",
                PublicId = "public_id_2",
                IsPrimary = false,
                SortOrder = 1,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.PetPhotos.AddRange(photo1, photo2);
            await _context.SaveChangesAsync();

            var items = new List<ReorderPhotoRequest>
            {
                new ReorderPhotoRequest { PhotoId = 1, SortOrder = 1 },
                new ReorderPhotoRequest { PhotoId = 2, SortOrder = 0 }
            };

            // Act
            var result = await _petPhotoService.ReorderPhotosAsync(items);

            // Assert
            Assert.True(result);
        }

        /// <summary>
        /// UTCID02: Abnormal case - Items null or empty
        /// Condition: Items is null or empty
        /// Expected: Throw ArgumentException
        /// </summary>
        [Fact]
        public async Task UTCID02_ReorderPhotosAsync_ItemsNullOrEmpty_ThrowsArgumentException()
        {
            // Arrange
            List<ReorderPhotoRequest>? nullItems = null;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _petPhotoService.ReorderPhotosAsync(nullItems!));

            Assert.Contains("Danh sách trống", exception.Message);
        }

        /// <summary>
        /// UTCID03: Abnormal case - Valid items but some PhotoIds not exist in DB
        /// Condition: Items has valid items, Some PhotoIds not exist, PetPhotos missing some
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID03_ReorderPhotosAsync_SomePhotosNotExist_ThrowsKeyNotFoundException()
        {
            // Arrange
            var photo1 = new PetPhoto
            {
                PhotoId = 1,
                PetId = 1,
                ImageUrl = "https://example.com/photo1.jpg",
                PublicId = "public_id_1",
                IsPrimary = true,
                SortOrder = 0,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.PetPhotos.Add(photo1);
            await _context.SaveChangesAsync();

            var items = new List<ReorderPhotoRequest>
            {
                new ReorderPhotoRequest { PhotoId = 1, SortOrder = 1 },
                new ReorderPhotoRequest { PhotoId = 999, SortOrder = 0 }  // PhotoId 999 not exists
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petPhotoService.ReorderPhotosAsync(items));

            Assert.Contains("Có ảnh không tồn tại", exception.Message);
        }

        /// <summary>
        /// UTCID04: Abnormal case - Valid items, all PhotoIds exist, but some photos IsDeleted=true
        /// Condition: Items has valid items, All PhotoIds exist in DB, Some photos IsDeleted=true
        /// Expected: Throw KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID04_ReorderPhotosAsync_SomePhotosDeleted_ThrowsKeyNotFoundException()
        {
            // Arrange
            var photo1 = new PetPhoto
            {
                PhotoId = 1,
                PetId = 1,
                ImageUrl = "https://example.com/photo1.jpg",
                PublicId = "public_id_1",
                IsPrimary = true,
                SortOrder = 0,
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            var photo2 = new PetPhoto
            {
                PhotoId = 2,
                PetId = 1,
                ImageUrl = "https://example.com/photo2.jpg",
                PublicId = "public_id_2",
                IsPrimary = false,
                SortOrder = 1,
                IsDeleted = true,  // Photo đã bị xóa
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.PetPhotos.AddRange(photo1, photo2);
            await _context.SaveChangesAsync();

            var items = new List<ReorderPhotoRequest>
            {
                new ReorderPhotoRequest { PhotoId = 1, SortOrder = 1 },
                new ReorderPhotoRequest { PhotoId = 2, SortOrder = 0 }
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _petPhotoService.ReorderPhotosAsync(items));

            Assert.Contains("Có ảnh không tồn tại", exception.Message);
        }

        #endregion
    }
}
