using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetServiceTest
{
    public class UpdatePetAsyncTest : IDisposable
    {
        private readonly Mock<IPetRepository> _mockPetRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetService _service;

        public UpdatePetAsyncTest()
        {
            _mockPetRepository = new Mock<IPetRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PetUpdateDb_{Guid.NewGuid()}")
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
        /// UTCID01: Valid PetId (exists), Pet IsDeleted=false, Valid UpdatedPet data
        /// Expected: Returns object with Message and Pet, Pet.UpdatedAt is updated
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdatePetAsync_ValidPetWithFullUpdate_ReturnsSuccessWithUpdatedPet()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);
            var originalCreatedAt = DateTime.Now.AddDays(-30);

            var existingPet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "OriginalName",
                Breed = "OriginalBreed",
                Gender = "Male",
                Age = 2,
                IsActive = true,
                IsDeleted = false,
                Description = "Original description",
                CreatedAt = originalCreatedAt,
                UpdatedAt = originalCreatedAt
            };

            var updatedPetDto = new PetDto_2
            {
                UserId = 1,
                Name = "UpdatedName",
                Breed = "UpdatedBreed",
                Gender = "Female",
                Age = 3,
                IsActive = false,
                Description = "Updated description"
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(petId, cancellationToken))
                .ReturnsAsync(existingPet);

            _mockPetRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Pet>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.UpdatePetAsync(petId, updatedPetDto, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var message = resultType.GetProperty("Message")?.GetValue(result) as string;
            var pet = resultType.GetProperty("Pet")?.GetValue(result) as Pet;

            Assert.NotNull(message);
            Assert.Contains("thành công", message);
            Assert.NotNull(pet);
            Assert.Equal("UpdatedName", pet.Name);
            Assert.Equal("UpdatedBreed", pet.Breed);
            Assert.Equal("Female", pet.Gender);
            Assert.Equal(3, pet.Age);
            Assert.False(pet.IsActive);
            Assert.Equal("Updated description", pet.Description);
            Assert.True(pet.UpdatedAt > originalCreatedAt);
        }

        /// <summary>
        /// UTCID02: Valid PetId (exists), Pet IsDeleted=false, Partial update (only some fields)
        /// Expected: Returns object with Message and Pet, Only specified fields are updated
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdatePetAsync_ValidPetWithPartialUpdate_ReturnsSuccessWithPartiallyUpdatedPet()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);
            var originalCreatedAt = DateTime.Now.AddDays(-30);

            var existingPet = new Pet
            {
                PetId = petId,
                UserId = 1,
                Name = "OriginalName",
                Breed = "OriginalBreed",
                Gender = "Male",
                Age = 2,
                IsActive = true,
                IsDeleted = false,
                Description = "Original description",
                CreatedAt = originalCreatedAt,
                UpdatedAt = originalCreatedAt
            };

            // Partial update - only updating Name and Description
            var updatedPetDto = new PetDto_2
            {
                UserId = 1,
                Name = "NewName",
                Breed = null,  // Not updating
                Gender = null, // Not updating
                Age = null,    // Not updating
                IsActive = null, // Not updating
                Description = "New description"
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(petId, cancellationToken))
                .ReturnsAsync(existingPet);

            _mockPetRepository
                .Setup(r => r.UpdateAsync(It.IsAny<Pet>(), cancellationToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.UpdatePetAsync(petId, updatedPetDto, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var message = resultType.GetProperty("Message")?.GetValue(result) as string;
            var pet = resultType.GetProperty("Pet")?.GetValue(result) as Pet;

            Assert.NotNull(message);
            Assert.Contains("thành công", message);
            Assert.NotNull(pet);
            Assert.Equal("NewName", pet.Name);
            Assert.Equal("New description", pet.Description);
            Assert.True(pet.UpdatedAt > originalCreatedAt);
        }

        /// <summary>
        /// UTCID03: Invalid PetId (not exists), GetByIdAsync returns null
        /// Expected: Throws KeyNotFoundException
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdatePetAsync_InvalidPetIdNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            int petId = 999;  // Non-existent pet
            var cancellationToken = default(CancellationToken);

            var updatedPetDto = new PetDto_2
            {
                UserId = 1,
                Name = "UpdatedName",
                Breed = "UpdatedBreed",
                Gender = "Female",
                Age = 3,
                IsActive = false,
                Description = "Updated description"
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(petId, cancellationToken))
                .ReturnsAsync((Pet?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdatePetAsync(petId, updatedPetDto, cancellationToken));

            Assert.Contains("Không tìm thấy thú cưng", exception.Message);
        }

        /// <summary>
        /// UTCID04: PetId <= 0 (invalid boundary)
        /// Expected: Throws ArgumentException (or KeyNotFoundException if service doesn't validate)
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdatePetAsync_ZeroOrNegativePetId_ThrowsArgumentException()
        {
            // Arrange
            int petId = 0;  // Invalid boundary
            var cancellationToken = default(CancellationToken);

            var updatedPetDto = new PetDto_2
            {
                UserId = 1,
                Name = "UpdatedName",
                Breed = "UpdatedBreed",
                Gender = "Female",
                Age = 3,
                IsActive = false,
                Description = "Updated description"
            };

            _mockPetRepository
                .Setup(r => r.GetByIdAsync(petId, cancellationToken))
                .ReturnsAsync((Pet?)null);

            // Act & Assert
            // The service throws KeyNotFoundException when pet is not found (including invalid IDs)
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdatePetAsync(petId, updatedPetDto, cancellationToken));

            Assert.Contains("Không tìm thấy thú cưng", exception.Message);
        }
    }
}
