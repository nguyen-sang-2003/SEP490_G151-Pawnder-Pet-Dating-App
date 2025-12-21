using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetServiceTest
{
    public class GetPetsByUserIdAsyncTest : IDisposable
    {
        private readonly Mock<IPetRepository> _mockPetRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetService _service;

        public GetPetsByUserIdAsyncTest()
        {
            _mockPetRepository = new Mock<IPetRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PetGetByUserIdDb_{Guid.NewGuid()}")
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

        /// <summary>
        /// UTCID01: Valid userId (exists), User has 1 pet, IsDeleted=FALSE, Has photos
        /// Expected: Returns IEnumerable<PetDto> with count = 1
        /// </summary>
        [Fact]
        public async Task UTCID01_GetPetsByUserIdAsync_ValidUserIdWithOnePetAndPhotos_ReturnsSinglePet()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            var expectedPets = new List<PetDto>
            {
                new PetDto
                {
                    PetId = 1,
                    Name = "Fluffy",
                    Breed = "Persian",
                    Gender = "Male",
                    Age = 2,
                    IsActive = true,
                    Description = "A cute Persian cat",
                    UrlImageAvatar = "https://example.com/photo1.jpg"
                }
            };

            _mockPetRepository
                .Setup(r => r.GetPetsByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.IsAssignableFrom<IEnumerable<PetDto>>(result);
            Assert.Equal("Fluffy", resultList[0].Name);
            Assert.NotEmpty(resultList[0].UrlImageAvatar!);
        }

        /// <summary>
        /// UTCID02: Valid userId (exists), User has multiple pets, IsDeleted=FALSE, Has photos
        /// Expected: Returns IEnumerable<PetDto> with count > 1
        /// </summary>
        [Fact]
        public async Task UTCID02_GetPetsByUserIdAsync_ValidUserIdWithMultiplePetsAndPhotos_ReturnsMultiplePets()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            var expectedPets = new List<PetDto>
            {
                new PetDto
                {
                    PetId = 1,
                    Name = "Fluffy",
                    Breed = "Persian",
                    Gender = "Male",
                    Age = 2,
                    IsActive = true,
                    Description = "A cute Persian cat",
                    UrlImageAvatar = "https://example.com/photo1.jpg"
                },
                new PetDto
                {
                    PetId = 2,
                    Name = "Whiskers",
                    Breed = "Siamese",
                    Gender = "Female",
                    Age = 3,
                    IsActive = false,
                    Description = "A lovely Siamese cat",
                    UrlImageAvatar = "https://example.com/photo2.jpg"
                },
                new PetDto
                {
                    PetId = 3,
                    Name = "Shadow",
                    Breed = "British Shorthair",
                    Gender = "Male",
                    Age = 1,
                    IsActive = false,
                    Description = "A playful British Shorthair",
                    UrlImageAvatar = "https://example.com/photo3.jpg"
                }
            };

            _mockPetRepository
                .Setup(r => r.GetPetsByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.True(resultList.Count > 1);
            Assert.Equal(3, resultList.Count);
            Assert.IsAssignableFrom<IEnumerable<PetDto>>(result);
        }

        /// <summary>
        /// UTCID03: Valid userId (exists), User has pets, IsDeleted=FALSE, No photos
        /// Expected: Returns IEnumerable<PetDto> with count = 0 (or empty UrlImageAvatar)
        /// </summary>
        [Fact]
        public async Task UTCID03_GetPetsByUserIdAsync_ValidUserIdWithPetsNoPhotos_ReturnsPetsWithEmptyPhoto()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            var expectedPets = new List<PetDto>
            {
                new PetDto
                {
                    PetId = 1,
                    Name = "Fluffy",
                    Breed = "Persian",
                    Gender = "Male",
                    Age = 2,
                    IsActive = true,
                    Description = "A cute Persian cat",
                    UrlImageAvatar = string.Empty // No photo
                }
            };

            _mockPetRepository
                .Setup(r => r.GetPetsByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.IsAssignableFrom<IEnumerable<PetDto>>(result);
            Assert.Empty(resultList[0].UrlImageAvatar!);
        }

        /// <summary>
        /// UTCID04: Valid userId (exists), User has no pets (FALSE)
        /// Expected: Returns IEnumerable<PetDto> with count = 0
        /// </summary>
        [Fact]
        public async Task UTCID04_GetPetsByUserIdAsync_ValidUserIdNoPets_ReturnsEmptyList()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);

            var expectedPets = new List<PetDto>();

            _mockPetRepository
                .Setup(r => r.GetPetsByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<PetDto>>(result);
        }

        /// <summary>
        /// UTCID05: Invalid userId (not exists), User has no pets (FALSE)
        /// Expected: Returns IEnumerable<PetDto> with count = 0
        /// </summary>
        [Fact]
        public async Task UTCID05_GetPetsByUserIdAsync_InvalidUserIdNotExists_ReturnsEmptyList()
        {
            // Arrange
            int userId = 999; // Non-existent user
            var cancellationToken = default(CancellationToken);

            var expectedPets = new List<PetDto>();

            _mockPetRepository
                .Setup(r => r.GetPetsByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<PetDto>>(result);
        }

        /// <summary>
        /// UTCID06: UserId = 0 (boundary), User has no pets (FALSE)
        /// Expected: Returns IEnumerable<PetDto> with count = 0
        /// </summary>
        [Fact]
        public async Task UTCID06_GetPetsByUserIdAsync_ZeroUserId_ReturnsEmptyList()
        {
            // Arrange
            int userId = 0; // Boundary case
            var cancellationToken = default(CancellationToken);

            var expectedPets = new List<PetDto>();

            _mockPetRepository
                .Setup(r => r.GetPetsByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedPets);

            // Act
            var result = await _service.GetPetsByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<PetDto>>(result);
        }
    }
}
