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
    public class GetNotificationByIdAsyncTest : IDisposable
    {
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly NotificationService _service;

        public GetNotificationByIdAsyncTest()
        {
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"NotificationGetByIdDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            _service = new NotificationService(
                _mockNotificationRepo.Object,
                _context,
                _mockHubContext.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: NotificationId > 0, Notification exists
        /// -> Trả về NotificationDto với các properties hợp lệ.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetNotificationByIdAsync_ExistingNotification_ReturnsNotification()
        {
            // Arrange
            var notification = new NotificationDto
            {
                NotificationId = 1,
                UserId = 1,
                Title = "Test Title",
                Message = "Test Message",
                CreatedAt = DateTime.Now,
                UserName = "Test User"
            };

            _mockNotificationRepo
                .Setup(r => r.GetNotificationByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(notification);

            // Act
            var result = await _service.GetNotificationByIdAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.NotificationId);
            Assert.NotNull(result.Title);
            Assert.NotNull(result.Message);
            Assert.NotNull(result.CreatedAt);
            Assert.NotNull(result.UserId);
            Assert.NotNull(result.UserName);
        }

        /// <summary>
        /// UTCID02: NotificationId > 0, Notification not exists
        /// -> Trả về null.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetNotificationByIdAsync_NotExists_ReturnsNull()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetNotificationByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((NotificationDto?)null);

            // Act
            var result = await _service.GetNotificationByIdAsync(999);

            // Assert
            Assert.Null(result);
        }

        /// <summary>
        /// UTCID03: NotificationId = 0, Notification not exists
        /// -> Trả về null.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetNotificationByIdAsync_ZeroId_ReturnsNull()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetNotificationByIdAsync(0, It.IsAny<CancellationToken>()))
                .ReturnsAsync((NotificationDto?)null);

            // Act
            var result = await _service.GetNotificationByIdAsync(0);

            // Assert
            Assert.Null(result);
        }

        /// <summary>
        /// UTCID04: NotificationId < 0, Notification not exists
        /// -> Trả về null.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetNotificationByIdAsync_NegativeId_ReturnsNull()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetNotificationByIdAsync(-1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((NotificationDto?)null);

            // Act
            var result = await _service.GetNotificationByIdAsync(-1);

            // Assert
            Assert.Null(result);
        }

        /// <summary>
        /// UTCID05: NotificationId = int.MaxValue, Notification not exists
        /// -> Trả về null.
        /// </summary>
        [Fact]
        public async Task UTCID05_GetNotificationByIdAsync_MaxIntId_ReturnsNull()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetNotificationByIdAsync(int.MaxValue, It.IsAny<CancellationToken>()))
                .ReturnsAsync((NotificationDto?)null);

            // Act
            var result = await _service.GetNotificationByIdAsync(int.MaxValue);

            // Assert
            Assert.Null(result);
        }

        /// <summary>
        /// UTCID06: NotificationId = int.MinValue, Notification not exists
        /// -> Trả về null.
        /// </summary>
        [Fact]
        public async Task UTCID06_GetNotificationByIdAsync_MinIntId_ReturnsNull()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetNotificationByIdAsync(int.MinValue, It.IsAny<CancellationToken>()))
                .ReturnsAsync((NotificationDto?)null);

            // Act
            var result = await _service.GetNotificationByIdAsync(int.MinValue);

            // Assert
            Assert.Null(result);
        }
    }
}
