using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.NotificationServiceTest
{
    public class CreateNotificationAsyncTest : IDisposable
    {
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly NotificationService _service;

        public CreateNotificationAsyncTest()
        {
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"NotificationCreateDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            _service = new NotificationService(
                _mockNotificationRepo.Object,
                _context,
                _mockHubContext.Object);

            // Setup default mocks
            SetupDefaultMocks();
        }

        private void SetupDefaultMocks()
        {
            // Setup HubContext mock
            var mockClients = new Mock<IHubClients>();
            var mockClientProxy = new Mock<IClientProxy>();
            var mockSingleClientProxy = new Mock<ISingleClientProxy>();
            mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
            mockClients.Setup(c => c.User(It.IsAny<string>())).Returns(mockClientProxy.Object);
            mockClients.Setup(c => c.Client(It.IsAny<string>())).Returns(mockSingleClientProxy.Object);
            _mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);

            // Setup NotificationRepository AddAsync mock
            _mockNotificationRepo
                .Setup(r => r.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Notification n, CancellationToken _) => n);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId, string email, bool isDeleted = false)
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = email,
                    FullName = "Test User",
                    PasswordHash = "hash",
                    UserStatusId = 2,
                    IsDeleted = isDeleted,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: Valid DTO, UserId > 0, valid Title, valid Message, UserExists=TRUE, SignalR succeeds
        /// -> Trả về Notification object với các properties matching input.
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateNotificationAsync_ValidInput_ReturnsNotification()
        {
            // Arrange
            SeedUser(1, "user@test.com");

            var dto = new NotificationDto_1
            {
                UserId = 1,
                Title = "Test Title",
                Message = "Test Message",
                Type = "expert_confirmation"
            };

            // Act
            var result = await _service.CreateNotificationAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.UserId);
            Assert.Equal("Test Title", result.Title);
            Assert.Equal("Test Message", result.Message);
            Assert.Equal("expert_confirmation", result.Type);
            Assert.False(result.IsRead);
            Assert.NotNull(result.CreatedAt);
            Assert.NotNull(result.UpdatedAt);
        }

        /// <summary>
        /// UTCID02: Valid input, SignalR fails (doesn't throw, notification still created)
        /// -> Trả về Notification object.
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateNotificationAsync_SignalRFails_StillReturnsNotification()
        {
            // Arrange
            SeedUser(1, "user@test.com");

            // Make SignalR throw
            var mockClients = new Mock<IHubClients>();
            mockClients.Setup(c => c.Group(It.IsAny<string>())).Throws(new Exception("SignalR error"));
            _mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);

            var dto = new NotificationDto_1
            {
                UserId = 1,
                Title = "Test Title",
                Message = "Test Message"
            };

            // Act - should not throw even if SignalR fails
            var result = await _service.CreateNotificationAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.UserId);
            Assert.Equal("Test Title", result.Title);
        }

        /// <summary>
        /// UTCID03: NotificationDto is null
        /// -> Ném ArgumentNullException với message "Thông báo không hợp lệ".
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateNotificationAsync_NullDto_ThrowsArgumentNullException()
        {
            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentNullException>(
                () => _service.CreateNotificationAsync(null!));

            Assert.Contains("Thông báo không hợp lệ", ex.Message);
        }

        /// <summary>
        /// UTCID04: UserId is null
        /// -> Ném ArgumentException với message "UserId không hợp lệ".
        /// </summary>
        [Fact]
        public async Task UTCID04_CreateNotificationAsync_NullUserId_ThrowsArgumentException()
        {
            // Arrange
            var dto = new NotificationDto_1
            {
                UserId = null,
                Title = "Test Title",
                Message = "Test Message"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateNotificationAsync(dto));

            Assert.Contains("UserId không hợp lệ", ex.Message);
        }

        /// <summary>
        /// UTCID05: Title is null
        /// -> Ném ArgumentException với message "Title không được để trống".
        /// </summary>
        [Fact]
        public async Task UTCID05_CreateNotificationAsync_NullTitle_ThrowsArgumentException()
        {
            // Arrange
            var dto = new NotificationDto_1
            {
                UserId = 1,
                Title = null,
                Message = "Test Message"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateNotificationAsync(dto));

            Assert.Contains("Title không được để trống", ex.Message);
        }

        /// <summary>
        /// UTCID06: Title is empty/whitespace
        /// -> Ném ArgumentException với message "Title không được để trống".
        /// </summary>
        [Fact]
        public async Task UTCID06_CreateNotificationAsync_EmptyTitle_ThrowsArgumentException()
        {
            // Arrange
            var dto = new NotificationDto_1
            {
                UserId = 1,
                Title = "   ", // whitespace
                Message = "Test Message"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateNotificationAsync(dto));

            Assert.Contains("Title không được để trống", ex.Message);
        }

        /// <summary>
        /// UTCID07: Message is null
        /// -> Ném ArgumentException với message "Message không được để trống".
        /// </summary>
        [Fact]
        public async Task UTCID07_CreateNotificationAsync_NullMessage_ThrowsArgumentException()
        {
            // Arrange
            var dto = new NotificationDto_1
            {
                UserId = 1,
                Title = "Test Title",
                Message = null
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateNotificationAsync(dto));

            Assert.Contains("Message không được để trống", ex.Message);
        }

        /// <summary>
        /// UTCID08: Message is empty/whitespace
        /// -> Ném ArgumentException với message "Message không được để trống".
        /// </summary>
        [Fact]
        public async Task UTCID08_CreateNotificationAsync_EmptyMessage_ThrowsArgumentException()
        {
            // Arrange
            var dto = new NotificationDto_1
            {
                UserId = 1,
                Title = "Test Title",
                Message = "   " // whitespace
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateNotificationAsync(dto));

            Assert.Contains("Message không được để trống", ex.Message);
        }

        /// <summary>
        /// UTCID09: Valid input - verifying default Type value
        /// -> Type mặc định là "expert_confirmation" nếu không được cung cấp.
        /// </summary>
        [Fact]
        public async Task UTCID09_CreateNotificationAsync_NoType_DefaultsToExpertConfirmation()
        {
            // Arrange
            SeedUser(1, "user@test.com");

            var dto = new NotificationDto_1
            {
                UserId = 1,
                Title = "Test Title",
                Message = "Test Message",
                Type = null // No type provided
            };

            // Act
            var result = await _service.CreateNotificationAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("expert_confirmation", result.Type);
        }

        /// <summary>
        /// UTCID10: User does not exist in database
        /// -> Ném ArgumentException với message về UserId không tồn tại.
        /// </summary>
        [Fact]
        public async Task UTCID10_CreateNotificationAsync_UserNotExists_ThrowsArgumentException()
        {
            // Arrange - no user seeded
            var dto = new NotificationDto_1
            {
                UserId = 999, // Non-existent user
                Title = "Test Title",
                Message = "Test Message"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateNotificationAsync(dto));

            Assert.Contains("không tồn tại", ex.Message);
        }

        /// <summary>
        /// UTCID11: User is deleted (IsDeleted = true)
        /// -> Ném ArgumentException với message về UserId không tồn tại.
        /// </summary>
        [Fact]
        public async Task UTCID11_CreateNotificationAsync_UserIsDeleted_ThrowsArgumentException()
        {
            // Arrange
            SeedUser(1, "user@test.com", isDeleted: true);

            var dto = new NotificationDto_1
            {
                UserId = 1,
                Title = "Test Title",
                Message = "Test Message"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateNotificationAsync(dto));

            Assert.Contains("không tồn tại", ex.Message);
        }

        /// <summary>
        /// UTCID12: UserId <= 0 (invalid)
        /// -> Ném ArgumentException với message "UserId không hợp lệ".
        /// </summary>
        [Fact]
        public async Task UTCID12_CreateNotificationAsync_InvalidUserId_ThrowsArgumentException()
        {
            // Arrange
            var dto = new NotificationDto_1
            {
                UserId = 0, // Invalid
                Title = "Test Title",
                Message = "Test Message"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CreateNotificationAsync(dto));

            Assert.Contains("UserId không hợp lệ", ex.Message);
        }
    }
}
