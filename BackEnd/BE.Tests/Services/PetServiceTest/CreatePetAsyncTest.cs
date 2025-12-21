using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.PetServiceTest
{
    public class CreatePetAsyncTest : IDisposable
    {
        private readonly Mock<IPetRepository> _mockPetRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly PetService _service;

        public CreatePetAsyncTest()
        {
            _mockPetRepository = new Mock<IPetRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PetCreateDb_{Guid.NewGuid()}")
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
        /// UTCID01: Valid Pet Object with all fields
        /// Expected: Returns object with pet details
        /// </summary>
        [Fact]
        public async Task UTCID01_CreatePetAsync_ValidPetWithAllFields_ReturnsSuccessObject()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);

            var petDto = new PetDto_2
            {
                UserId = 1,
                Name = "Fluffy",
                Breed = "Persian",
                Gender = "Male",
                Age = 2,
                IsActive = true,
                Description = "A cute Persian cat"
            };

            _mockPetRepository
                .Setup(r => r.AddAsync(It.IsAny<Pet>(), cancellationToken))
                .ReturnsAsync((Pet p, CancellationToken _) => 
                {
                    p.PetId = 1; // Simulate ID assignment
                    return p;
                });

            // Act
            var result = await _service.CreatePetAsync(petDto, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var petId = resultType.GetProperty("PetId")?.GetValue(result);
            var userId = resultType.GetProperty("UserId")?.GetValue(result) as int?;
            var name = resultType.GetProperty("Name")?.GetValue(result) as string;
            var gender = resultType.GetProperty("Gender")?.GetValue(result) as string;
            var description = resultType.GetProperty("Description")?.GetValue(result) as string;
            var isActive = resultType.GetProperty("IsActive")?.GetValue(result) as bool?;
            var createdAt = resultType.GetProperty("CreatedAt")?.GetValue(result) as DateTime?;

            Assert.Equal(1, userId);
            Assert.Equal("Fluffy", name);
            Assert.Equal("Male", gender);
            Assert.Equal("A cute Persian cat", description);
            Assert.True(isActive);
            Assert.NotNull(createdAt);
        }

        /// <summary>
        /// UTCID02: Valid Pet Object with minimal fields
        /// Expected: Returns object with pet details
        /// </summary>
        [Fact]
        public async Task UTCID02_CreatePetAsync_ValidPetWithMinimalFields_ReturnsSuccessObject()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);

            var petDto = new PetDto_2
            {
                UserId = 1,
                Name = "Buddy",
                Breed = null,
                Gender = null,
                Age = null,
                IsActive = false,
                Description = null
            };

            _mockPetRepository
                .Setup(r => r.AddAsync(It.IsAny<Pet>(), cancellationToken))
                .ReturnsAsync((Pet p, CancellationToken _) => 
                {
                    p.PetId = 1;
                    return p;
                });

            // Act
            var result = await _service.CreatePetAsync(petDto, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var userId = resultType.GetProperty("UserId")?.GetValue(result) as int?;
            var name = resultType.GetProperty("Name")?.GetValue(result) as string;

            Assert.Equal(1, userId);
            Assert.Equal("Buddy", name);
        }

        /// <summary>
        /// UTCID03: Invalid Pet Object - null petDto
        /// Expected: Throws ArgumentNullException
        /// </summary>
        [Fact]
        public async Task UTCID03_CreatePetAsync_NullPetDto_ThrowsArgumentNullException()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);
            PetDto_2? petDto = null;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentNullException>(
                () => _service.CreatePetAsync(petDto!, cancellationToken));

            Assert.Contains("Dữ liệu thú cưng không hợp lệ", exception.Message);
        }

        /// <summary>
        /// UTCID04: Invalid Pet Object - Empty Name
        /// Note: Service doesn't validate empty name, it's passed through
        /// Expected: Returns object (no validation in service)
        /// </summary>
        [Fact]
        public async Task UTCID04_CreatePetAsync_EmptyName_ReturnsObject()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);

            var petDto = new PetDto_2
            {
                UserId = 1,
                Name = "",  // Empty name
                Breed = "Persian",
                Gender = "Male",
                Age = 2,
                IsActive = true,
                Description = "A cat"
            };

            _mockPetRepository
                .Setup(r => r.AddAsync(It.IsAny<Pet>(), cancellationToken))
                .ReturnsAsync((Pet p, CancellationToken _) => 
                {
                    p.PetId = 1;
                    return p;
                });

            // Act
            var result = await _service.CreatePetAsync(petDto, cancellationToken);

            // Assert
            // Service doesn't validate empty name - it passes through
            Assert.NotNull(result);
            var resultType = result.GetType();
            var name = resultType.GetProperty("Name")?.GetValue(result) as string;
            Assert.Equal("", name);
        }

        /// <summary>
        /// UTCID05: Invalid Pet Object - Negative Age
        /// Note: Service doesn't validate negative age, it's passed through
        /// Expected: Returns object (no validation in service)
        /// </summary>
        [Fact]
        public async Task UTCID05_CreatePetAsync_NegativeAge_ReturnsObject()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);

            var petDto = new PetDto_2
            {
                UserId = 1,
                Name = "Fluffy",
                Breed = "Persian",
                Gender = "Male",
                Age = -5,  // Negative age
                IsActive = true,
                Description = "A cat"
            };

            _mockPetRepository
                .Setup(r => r.AddAsync(It.IsAny<Pet>(), cancellationToken))
                .ReturnsAsync((Pet p, CancellationToken _) => 
                {
                    p.PetId = 1;
                    return p;
                });

            // Act
            var result = await _service.CreatePetAsync(petDto, cancellationToken);

            // Assert
            // Service doesn't validate negative age - it passes through
            Assert.NotNull(result);
        }

        /// <summary>
        /// UTCID06: Valid Pet Object with special characters in name
        /// Expected: Returns object with pet details
        /// </summary>
        [Fact]
        public async Task UTCID06_CreatePetAsync_SpecialCharactersInName_ReturnsSuccessObject()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);

            var petDto = new PetDto_2
            {
                UserId = 1,
                Name = "Fluffy 🐱 Cat!",  // Special characters
                Breed = "Persian Mix",
                Gender = "Female",
                Age = 3,
                IsActive = true,
                Description = "A lovely cat with emojis"
            };

            _mockPetRepository
                .Setup(r => r.AddAsync(It.IsAny<Pet>(), cancellationToken))
                .ReturnsAsync((Pet p, CancellationToken _) => 
                {
                    p.PetId = 1;
                    return p;
                });

            // Act
            var result = await _service.CreatePetAsync(petDto, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            var name = resultType.GetProperty("Name")?.GetValue(result) as string;
            Assert.Equal("Fluffy 🐱 Cat!", name);
        }
    }
}
