using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ReportServiceTest
{
    public class CreateReportAsyncTest : IDisposable
    {
        private readonly Mock<IReportRepository> _mockReportRepository;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly PawnderDatabaseContext _context;
        private readonly ReportService _reportService;

        public CreateReportAsyncTest()
        {
            // Setup: Khởi tạo mocks
            _mockReportRepository = new Mock<IReportRepository>();
            _mockNotificationService = new Mock<INotificationService>();

            // Create real InMemory DbContext
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Khởi tạo service
            _reportService = new ReportService(
                _mockReportRepository.Object,
                _context,
                _mockNotificationService.Object
            );
        }

        public void Dispose()
        {
            _context?.Dispose();
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Abnormal case - Reason is null/empty
        /// Condition: dto.Reason is null or empty
        /// Expected: Throws ArgumentException, AddAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateReportAsync_ReasonNullOrEmpty_ThrowsArgumentException()
        {
            // Arrange
            int userReportId = 1;
            int contentId = 1;
            var cancellationToken = new CancellationToken();

            var dto = new ReportCreateDTO
            {
                Reason = ""
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(
                () => _reportService.CreateReportAsync(userReportId, contentId, dto, cancellationToken));

            Assert.Contains("Reason is required", exception.Message);

            // Verify repository interaction - AddAsync should not be called
            _mockReportRepository.Verify(
                r => r.AddAsync(It.IsAny<Report>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID02: Normal case - All valid, no existing block, chat exists
        /// Condition: Reporter user exists, Content.FromPet user exists, no existing block, chat between users active
        /// Expected: Success object with data, AddAsync called once, Block inserted, Chat soft-deleted
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateReportAsync_AllValidNoExistingBlock_ReturnsSuccessAndCreatesBlockAndSoftDeletesChat()
        {
            // Arrange
            int userReportId = 1;
            int contentId = 1;
            int reportedUserId = 2;
            var cancellationToken = new CancellationToken();

            // Setup user (reporter)
            var user = new User
            {
                UserId = userReportId,
                FullName = "Reporter User",
                Email = "reporter@example.com",
                PasswordHash = "hashedpassword123",
                IsDeleted = false
            };
            _context.Users.Add(user);

            // Setup reported user
            var reportedUser = new User
            {
                UserId = reportedUserId,
                FullName = "Reported User",
                Email = "reported@example.com",
                PasswordHash = "hashedpassword456",
                IsDeleted = false
            };
            _context.Users.Add(reportedUser);

            // Setup pet for reported user
            var pet = new Pet
            {
                PetId = 1,
                UserId = reportedUserId,
                Name = "TestPet",
                Breed = "TestBreed",
                Gender = "Male",
                IsDeleted = false
            };
            _context.Pets.Add(pet);

            // Setup content
            var content = new ChatUserContent
            {
                ContentId = contentId,
                FromPetId = 1,
                Message = "Test message",
                CreatedAt = DateTime.Now
            };
            _context.ChatUserContents.Add(content);

            await _context.SaveChangesAsync();

            var dto = new ReportCreateDTO
            {
                Reason = "Spam content"
            };

            _mockReportRepository
                .Setup(r => r.AddAsync(It.IsAny<Report>(), cancellationToken))
                .ReturnsAsync((Report r, CancellationToken ct) => r);

            // Act
            var result = await _reportService.CreateReportAsync(userReportId, contentId, dto, cancellationToken);

            // Assert
            Assert.NotNull(result);

            // Verify repository interaction - AddAsync called once
            _mockReportRepository.Verify(
                r => r.AddAsync(It.IsAny<Report>(), cancellationToken),
                Times.Once);

            // Verify block was inserted
            var block = await _context.Blocks.FirstOrDefaultAsync(b => 
                b.FromUserId == userReportId && b.ToUserId == reportedUserId);
            Assert.NotNull(block);
        }

        /// <summary>
        /// UTCID03: Abnormal case - User not found
        /// Condition: Reporter user does not exist in database
        /// Expected: Throws KeyNotFoundException, AddAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateReportAsync_UserNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int userReportId = 999; // Non-existent user
            int contentId = 1;
            var cancellationToken = new CancellationToken();

            var dto = new ReportCreateDTO
            {
                Reason = "Spam content"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _reportService.CreateReportAsync(userReportId, contentId, dto, cancellationToken));

            Assert.Contains($"User with ID {userReportId} not found", exception.Message);

            // Verify repository interaction - AddAsync should not be called
            _mockReportRepository.Verify(
                r => r.AddAsync(It.IsAny<Report>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: Abnormal case - Content not found
        /// Condition: Content does not exist in database
        /// Expected: Throws KeyNotFoundException, AddAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID04_CreateReportAsync_ContentNotFound_ThrowsKeyNotFoundException()
        {
            // Arrange
            int userReportId = 1;
            int contentId = 999; // Non-existent content
            var cancellationToken = new CancellationToken();

            // Setup user
            var user = new User
            {
                UserId = userReportId,
                FullName = "Reporter User",
                Email = "reporter@example.com",
                PasswordHash = "hashedpassword123",
                IsDeleted = false
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var dto = new ReportCreateDTO
            {
                Reason = "Spam content"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _reportService.CreateReportAsync(userReportId, contentId, dto, cancellationToken));

            Assert.Contains($"Content with ID {contentId} not found", exception.Message);

            // Verify repository interaction - AddAsync should not be called
            _mockReportRepository.Verify(
                r => r.AddAsync(It.IsAny<Report>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID05: Abnormal case - Content.FromPet is null or UserId is null
        /// Condition: Content exists but FromPet or FromPet.UserId is null
        /// Expected: Throws InvalidOperationException ("Invalid message sender"), AddAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID05_CreateReportAsync_InvalidMessageSender_ThrowsInvalidOperationException()
        {
            // Arrange
            int userReportId = 1;
            int contentId = 1;
            var cancellationToken = new CancellationToken();

            // Setup user
            var user = new User
            {
                UserId = userReportId,
                FullName = "Reporter User",
                Email = "reporter@example.com",
                PasswordHash = "hashedpassword123",
                IsDeleted = false
            };
            _context.Users.Add(user);

            // Setup content without FromPet
            var content = new ChatUserContent
            {
                ContentId = contentId,
                FromPetId = null, // No pet associated
                Message = "Test message",
                CreatedAt = DateTime.Now
            };
            _context.ChatUserContents.Add(content);

            await _context.SaveChangesAsync();

            var dto = new ReportCreateDTO
            {
                Reason = "Spam content"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _reportService.CreateReportAsync(userReportId, contentId, dto, cancellationToken));

            Assert.Contains("Invalid message sender", exception.Message);

            // Verify repository interaction - AddAsync should not be called
            _mockReportRepository.Verify(
                r => r.AddAsync(It.IsAny<Report>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID06: Abnormal case - Reporter equals reported user
        /// Condition: userReportId equals the UserId of the pet that sent the message
        /// Expected: Throws InvalidOperationException ("Cannot report yourself"), AddAsync not called
        /// </summary>
        [Fact]
        public async Task UTCID06_CreateReportAsync_ReporterEqualsReportedUser_ThrowsInvalidOperationException()
        {
            // Arrange
            int userReportId = 1;
            int contentId = 1;
            var cancellationToken = new CancellationToken();

            // Setup user (same as reported user)
            var user = new User
            {
                UserId = userReportId,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashedpassword123",
                IsDeleted = false
            };
            _context.Users.Add(user);

            // Setup pet belonging to the same user
            var pet = new Pet
            {
                PetId = 1,
                UserId = userReportId, // Same as reporter
                Name = "TestPet",
                Breed = "TestBreed",
                Gender = "Male",
                IsDeleted = false
            };
            _context.Pets.Add(pet);

            // Setup content from user's own pet
            var content = new ChatUserContent
            {
                ContentId = contentId,
                FromPetId = 1,
                Message = "Test message",
                CreatedAt = DateTime.Now
            };
            _context.ChatUserContents.Add(content);

            await _context.SaveChangesAsync();

            var dto = new ReportCreateDTO
            {
                Reason = "Spam content"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _reportService.CreateReportAsync(userReportId, contentId, dto, cancellationToken));

            Assert.Contains("Cannot report yourself", exception.Message);

            // Verify repository interaction - AddAsync should not be called
            _mockReportRepository.Verify(
                r => r.AddAsync(It.IsAny<Report>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID07: Normal case - Existing block between reporter and reported user
        /// Condition: All valid, block already exists between users
        /// Expected: Success object with data, AddAsync called once, no new block inserted
        /// </summary>
        [Fact]
        public async Task UTCID07_CreateReportAsync_ExistingBlockBetweenUsers_ReturnsSuccessWithoutNewBlock()
        {
            // Arrange
            int userReportId = 1;
            int contentId = 1;
            int reportedUserId = 2;
            var cancellationToken = new CancellationToken();

            // Setup user (reporter)
            var user = new User
            {
                UserId = userReportId,
                FullName = "Reporter User",
                Email = "reporter@example.com",
                PasswordHash = "hashedpassword123",
                IsDeleted = false
            };
            _context.Users.Add(user);

            // Setup reported user
            var reportedUser = new User
            {
                UserId = reportedUserId,
                FullName = "Reported User",
                Email = "reported@example.com",
                PasswordHash = "hashedpassword456",
                IsDeleted = false
            };
            _context.Users.Add(reportedUser);

            // Setup pet for reported user
            var pet = new Pet
            {
                PetId = 1,
                UserId = reportedUserId,
                Name = "TestPet",
                Breed = "TestBreed",
                Gender = "Male",
                IsDeleted = false
            };
            _context.Pets.Add(pet);

            // Setup content
            var content = new ChatUserContent
            {
                ContentId = contentId,
                FromPetId = 1,
                Message = "Test message",
                CreatedAt = DateTime.Now
            };
            _context.ChatUserContents.Add(content);

            // Setup existing block
            var existingBlock = new Block
            {
                FromUserId = userReportId,
                ToUserId = reportedUserId,
                CreatedAt = DateTime.Now.AddDays(-1)
            };
            _context.Blocks.Add(existingBlock);

            await _context.SaveChangesAsync();

            var dto = new ReportCreateDTO
            {
                Reason = "Spam content"
            };

            _mockReportRepository
                .Setup(r => r.AddAsync(It.IsAny<Report>(), cancellationToken))
                .ReturnsAsync((Report r, CancellationToken ct) => r);

            // Act
            var result = await _reportService.CreateReportAsync(userReportId, contentId, dto, cancellationToken);

            // Assert
            Assert.NotNull(result);

            // Verify repository interaction - AddAsync called once
            _mockReportRepository.Verify(
                r => r.AddAsync(It.IsAny<Report>(), cancellationToken),
                Times.Once);

            // Verify no new block was inserted (should still be only 1 block)
            var blockCount = await _context.Blocks.CountAsync(b => 
                b.FromUserId == userReportId && b.ToUserId == reportedUserId);
            Assert.Equal(1, blockCount);
        }

        #endregion
    }
}
