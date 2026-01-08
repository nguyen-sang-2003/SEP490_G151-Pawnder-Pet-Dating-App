using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetServiceTest
{
    public class GetPetByIdAsyncTest : IDisposable
    {
        private readonly Mock<IPetRepository> _mockPetRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetService _service;

        public GetPetByIdAsyncTest()
        {
            _mockPetRepository = new Mock<IPetRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PetGetByIdDb_{Guid.NewGuid()}")
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

        private Pet CreatePetWithDetails(
            int petId, 
            int userId, 
            int? petAge = null,
            bool hasPetCharacteristics = false,
            int? characteristicAge = null,
            bool hasPhotos = true,
            bool hasOwner = true)
        {
            var user = hasOwner ? new User
            {
                UserId = userId,
                Email = $"user{userId}@test.com",
                FullName = $"Test User {userId}",
                PasswordHash = "hash",
                Gender = "Male",
                Address = new Address
                {
                    AddressId = userId,
                    City = "Ho Chi Minh",
                    District = "District 1",
                    Ward = "Ward 1",
                    FullAddress = "123 Test Street",
                    Latitude = 10.762622m,
                    Longitude = 106.660172m
                }
            } : null;

            var pet = new Pet
            {
                PetId = petId,
                UserId = userId,
                Name = $"Pet{petId}",
                Breed = "Persian",
                Gender = "Male",
                Age = petAge,
                IsActive = true,
                IsDeleted = false,
                Description = "A lovely pet",
                User = user,
                PetPhotos = hasPhotos ? new List<PetPhoto>
                {
                    new PetPhoto { PhotoId = 1, PetId = petId, ImageUrl = "https://example.com/photo1.jpg", SortOrder = 1, IsDeleted = false },
                    new PetPhoto { PhotoId = 2, PetId = petId, ImageUrl = "https://example.com/photo2.jpg", SortOrder = 2, IsDeleted = false },
                    new PetPhoto { PhotoId = 3, PetId = petId, ImageUrl = "https://example.com/photo3.jpg", SortOrder = 3, IsDeleted = true } // Deleted photo
                } : new List<PetPhoto>(),
                PetCharacteristics = new List<PetCharacteristic>()
            };

            if (hasPetCharacteristics && characteristicAge.HasValue)
            {
                pet.PetCharacteristics.Add(new PetCharacteristic
                {
                    PetId = petId,
                    AttributeId = 1,
                    Value = characteristicAge.Value,
                    Attribute = new BE.Models.Attribute
                    {
                        AttributeId = 1,
                        Name = "Tuổi",
                        TypeValue = "number"
                    }
                });
            }

            return pet;
        }

        /// <summary>
        /// UTCID01: Valid PetId (exists), Pet has PetCharacteristics with Age, Has Photos, Has Owner
        /// Age from PetCharacteristic takes priority
        /// Expected: Returns valid object with Age from PetCharacteristic
        /// </summary>
        [Fact]
        public async Task UTCID01_GetPetByIdAsync_ValidPetWithCharacteristicsAndPhotos_ReturnsValidObjectWithCharacteristicAge()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);

            var pet = CreatePetWithDetails(
                petId: petId,
                userId: 1,
                petAge: 2,  // Old age from Pet.Age
                hasPetCharacteristics: true,
                characteristicAge: 3,  // Age from PetCharacteristic (priority)
                hasPhotos: true,
                hasOwner: true);

            _mockPetRepository
                .Setup(r => r.GetPetByIdWithDetailsAsync(petId, cancellationToken))
                .ReturnsAsync(pet);

            // Act
            var result = await _service.GetPetByIdAsync(petId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var returnedPetId = resultType.GetProperty("PetId")?.GetValue(result) as int?;
            var returnedUserId = resultType.GetProperty("UserId")?.GetValue(result) as int?;
            var returnedName = resultType.GetProperty("Name")?.GetValue(result) as string;
            var returnedBreed = resultType.GetProperty("Breed")?.GetValue(result) as string;
            var returnedGender = resultType.GetProperty("Gender")?.GetValue(result) as string;
            var returnedAge = resultType.GetProperty("Age")?.GetValue(result) as int?;
            var returnedIsActive = resultType.GetProperty("IsActive")?.GetValue(result) as bool?;
            var returnedOwner = resultType.GetProperty("Owner")?.GetValue(result);

            Assert.Equal(petId, returnedPetId);
            Assert.NotNull(returnedUserId);
            Assert.NotNull(returnedName);
            Assert.NotNull(returnedBreed);
            Assert.NotNull(returnedGender);
            Assert.Equal(3, returnedAge); // Age from PetCharacteristic
            Assert.NotNull(returnedIsActive);
            Assert.NotNull(returnedOwner);
        }

        /// <summary>
        /// UTCID02: Valid PetId (exists), Pet has NO PetCharacteristics, Has Photos, Has Owner
        /// Age from Pet.Age (old)
        /// Expected: Returns valid object with Age from Pet.Age
        /// </summary>
        [Fact]
        public async Task UTCID02_GetPetByIdAsync_ValidPetNoCharacteristicsWithPhotos_ReturnsValidObjectWithPetAge()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);

            var pet = CreatePetWithDetails(
                petId: petId,
                userId: 1,
                petAge: 2,  // Age from Pet.Age
                hasPetCharacteristics: false,
                characteristicAge: null,
                hasPhotos: true,
                hasOwner: true);

            _mockPetRepository
                .Setup(r => r.GetPetByIdWithDetailsAsync(petId, cancellationToken))
                .ReturnsAsync(pet);

            // Act
            var result = await _service.GetPetByIdAsync(petId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var returnedPetId = resultType.GetProperty("PetId")?.GetValue(result) as int?;
            var returnedAge = resultType.GetProperty("Age")?.GetValue(result) as int?;

            Assert.Equal(petId, returnedPetId);
            Assert.Equal(2, returnedAge); // Age from Pet.Age (old)
        }

        /// <summary>
        /// UTCID03: Valid PetId (exists), Pet has PetCharacteristics with Age, Has Photos, Has Owner
        /// Both Age sources available - PetCharacteristic takes priority
        /// Expected: Returns valid object with Age from PetCharacteristic
        /// </summary>
        [Fact]
        public async Task UTCID03_GetPetByIdAsync_ValidPetBothAgeSources_ReturnsAgeFromCharacteristic()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);

            var pet = CreatePetWithDetails(
                petId: petId,
                userId: 1,
                petAge: 5,  // Old age from Pet.Age
                hasPetCharacteristics: true,
                characteristicAge: 4,  // Age from PetCharacteristic (priority)
                hasPhotos: true,
                hasOwner: true);

            _mockPetRepository
                .Setup(r => r.GetPetByIdWithDetailsAsync(petId, cancellationToken))
                .ReturnsAsync(pet);

            // Act
            var result = await _service.GetPetByIdAsync(petId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var returnedPetId = resultType.GetProperty("PetId")?.GetValue(result) as int?;
            var returnedAge = resultType.GetProperty("Age")?.GetValue(result) as int?;
            var returnedName = resultType.GetProperty("Name")?.GetValue(result) as string;
            var returnedBreed = resultType.GetProperty("Breed")?.GetValue(result) as string;
            var returnedGender = resultType.GetProperty("Gender")?.GetValue(result) as string;
            var returnedIsActive = resultType.GetProperty("IsActive")?.GetValue(result) as bool?;

            Assert.Equal(petId, returnedPetId);
            Assert.Equal(4, returnedAge); // PetCharacteristic takes priority over Pet.Age
            Assert.NotNull(returnedName);
            Assert.NotNull(returnedBreed);
            Assert.NotNull(returnedGender);
            Assert.NotNull(returnedIsActive);
        }

        /// <summary>
        /// UTCID04: Valid PetId (exists), Pet has NO PetCharacteristics, NO Photos, Has Owner
        /// Age from Pet.Age (old)
        /// Expected: Returns valid object with empty UrlImage list
        /// </summary>
        [Fact]
        public async Task UTCID04_GetPetByIdAsync_ValidPetNoPhotos_ReturnsValidObjectWithEmptyPhotos()
        {
            // Arrange
            int petId = 1;
            var cancellationToken = default(CancellationToken);

            var pet = CreatePetWithDetails(
                petId: petId,
                userId: 1,
                petAge: 2,
                hasPetCharacteristics: false,
                characteristicAge: null,
                hasPhotos: false,  // No photos
                hasOwner: true);

            _mockPetRepository
                .Setup(r => r.GetPetByIdWithDetailsAsync(petId, cancellationToken))
                .ReturnsAsync(pet);

            // Act
            var result = await _service.GetPetByIdAsync(petId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var returnedPetId = resultType.GetProperty("PetId")?.GetValue(result) as int?;
            var returnedUserId = resultType.GetProperty("UserId")?.GetValue(result) as int?;
            var returnedName = resultType.GetProperty("Name")?.GetValue(result) as string;
            var returnedBreed = resultType.GetProperty("Breed")?.GetValue(result) as string;
            var returnedGender = resultType.GetProperty("Gender")?.GetValue(result) as string;
            var returnedAge = resultType.GetProperty("Age")?.GetValue(result) as int?;
            var returnedUrlImage = resultType.GetProperty("UrlImage")?.GetValue(result) as List<string>;

            Assert.Equal(petId, returnedPetId);
            Assert.NotNull(returnedUserId);
            Assert.NotNull(returnedName);
            Assert.NotNull(returnedBreed);
            Assert.NotNull(returnedGender);
            Assert.Equal(2, returnedAge);
            Assert.NotNull(returnedUrlImage);
            Assert.Empty(returnedUrlImage);
        }

        /// <summary>
        /// UTCID05: Invalid PetId (not exists)
        /// Expected: Returns null
        /// </summary>
        [Fact]
        public async Task UTCID05_GetPetByIdAsync_InvalidPetIdNotExists_ReturnsNull()
        {
            // Arrange
            int petId = 999;  // Non-existent pet
            var cancellationToken = default(CancellationToken);

            _mockPetRepository
                .Setup(r => r.GetPetByIdWithDetailsAsync(petId, cancellationToken))
                .ReturnsAsync((Pet?)null);

            // Act
            var result = await _service.GetPetByIdAsync(petId, cancellationToken);

            // Assert
            Assert.Null(result);
        }

        /// <summary>
        /// UTCID06: PetId = 0 (boundary)
        /// Expected: Returns null
        /// </summary>
        [Fact]
        public async Task UTCID06_GetPetByIdAsync_ZeroPetId_ReturnsNull()
        {
            // Arrange
            int petId = 0;  // Boundary case
            var cancellationToken = default(CancellationToken);

            _mockPetRepository
                .Setup(r => r.GetPetByIdWithDetailsAsync(petId, cancellationToken))
                .ReturnsAsync((Pet?)null);

            // Act
            var result = await _service.GetPetByIdAsync(petId, cancellationToken);

            // Assert
            Assert.Null(result);
        }
    }
}
