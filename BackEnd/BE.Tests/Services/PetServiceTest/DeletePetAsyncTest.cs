using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetServiceTest
{
    public class DeletePetAsyncTest : IDisposable
    {
        private readonly Mock<IPetRepository> _mockPetRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetService _service;

        public DeletePetAsyncTest()
        {
            _mockPetRepository = new Mock<IPetRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PetDeleteDb_{Guid.NewGuid()}")
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
        /// UTCID01: Valid PetId (exists), Pet IsDeleted=false (active)
        /// Expected: Returns true, Pet.IsDeleted=true, Pet.UpdatedAt is updated
        /// </summary>
        [Fact]
        public async Task UTCID01_DeletePetAsync_ValidActivePet_ReturnsTrue()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);
            var originalCreatedAt = DateTime.Now.AddDays(-30);

            var existingPet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "TestPet",
                Breed = "Persian",
                Gender = "Male",
                Age = 2,
                IsActive = true,
                IsDeleted = false,  // Active pet
                Description = "Test description",
                CreatedAt = originalCreatedAt,
                UpdatedAt = originalCreatedAt
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(petId, cancellationToken))
                .ReturnsAsync(existingPet);

            _mockPetRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Pet>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.DeletePetAsync(petId, cancellationToken);

            // Assert
            Assert.True(result);
            Assert.True(existingPet.IsDeleted);
            Assert.True(existingPet.UpdatedAt > originalCreatedAt);
        }

        /// <summary>
        /// UTCID02: Valid PetId (exists), Pet IsDeleted=true (already deleted)
        /// Expected: Returns true (soft delete updates again), Pet.IsDeleted=true, Pet.UpdatedAt is updated
        /// </summary>
        [Fact]
        public async Task UTCID02_DeletePetAsync_AlreadyDeletedPet_ReturnsTrue()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);
            var originalUpdatedAt = DateTime.Now.AddDays(-10);

            var existingPet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "TestPet",
                Breed = "Persian",
                Gender = "Male",
                Age = 2,
                IsActive = false,
                IsDeleted = true,  // Already deleted
                Description = "Test description",
                CreatedAt = DateTime.Now.AddDays(-30),
                UpdatedAt = originalUpdatedAt
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(petId, cancellationToken))
                .ReturnsAsync(existingPet);

            _mockPetRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Pet>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.DeletePetAsync(petId, cancellationToken);

            // Assert
            Assert.True(result);
            Assert.True(existingPet.IsDeleted);
            Assert.True(existingPet.UpdatedAt > originalUpdatedAt);
        }

        /// <summary>
        /// UTCID03: Invalid PetId (not exists), GetByIdAsync returns null
        /// Expected: Returns false
        /// </summary>
        [Fact]
        public async Task UTCID03_DeletePetAsync_InvalidPetIdNotExists_ReturnsFalse()
        {
            // Arrange
            int petId = 999;  // Non-existent pet
            var cancellationToken = default(CancellationToken);

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(petId, cancellationToken))
                .ReturnsAsync((Pet?)null);

            // Act
            var result = await _service.DeletePetAsync(petId, cancellationToken);

            // Assert
            Assert.False(result);
        }

        /// <summary>
        /// UTCID04: Valid PetId (exists) but GetByIdAsync returns null
        /// Expected: Returns false
        /// </summary>
        [Fact]
        public async Task UTCID04_DeletePetAsync_ValidPetIdButRepositoryReturnsNull_ReturnsFalse()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);

            // Repository returns null even for valid ID (edge case)
            _mockPetRepository
                .Setup(r => r.GetByIdAsync(petId, cancellationToken))
                .ReturnsAsync((Pet?)null);

            // Act
            var result = await _service.DeletePetAsync(petId, cancellationToken);

            // Assert
            Assert.False(result);
        }
    }
}
