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
    public class GetUnreadCountAsyncTest : IDisposable
    {
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly NotificationService _service;

        public GetUnreadCountAsyncTest()
        {
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"NotificationGetUnreadCountDb_{Guid.NewGuid()}")
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
        /// UTCID01: User has 1 unread system notification
        /// -> Returns 1.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetUnreadCountAsync_OneUnreadNotification_ReturnsOne()
        {
            // Arrange
            const int userId = 1;

            _mockNotificationRepo
                .Setup(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _service.GetUnreadCountAsync(userId);

            // Assert
            Assert.Equal(1, result);
            _mockNotificationRepo.Verify(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID02: User has notifications but all are read
        /// -> Returns 0.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetUnreadCountAsync_AllRead_ReturnsZero()
        {
            // Arrange
            const int userId = 1;

            _mockNotificationRepo
                .Setup(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(0);

            // Act
            var result = await _service.GetUnreadCountAsync(userId);

            // Assert
            Assert.Equal(0, result);
            _mockNotificationRepo.Verify(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID03: User has 3 unread expert_confirmation notifications
        /// -> Returns 3.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetUnreadCountAsync_MultipleUnread_ReturnsThree()
        {
            // Arrange
            const int userId = 1;

            _mockNotificationRepo
                .Setup(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(3);

            // Act
            var result = await _service.GetUnreadCountAsync(userId);

            // Assert
            Assert.Equal(3, result);
            _mockNotificationRepo.Verify(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID04: Mixed types (5 total, 2 counted due to type filter)
        /// -> Returns 2 (filtered count for system OR expert_confirmation).
        /// </summary>
        [Fact]
        public async Task UTCID04_GetUnreadCountAsync_MixedTypes_ReturnsFilteredCount()
        {
            // Arrange
            const int userId = 1;

            // Repository returns filtered count (only system or expert_confirmation types)
            _mockNotificationRepo
                .Setup(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(2);

            // Act
            var result = await _service.GetUnreadCountAsync(userId);

            // Assert
            Assert.Equal(2, result);
            _mockNotificationRepo.Verify(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID05: User has no notifications
        /// -> Returns 0.
        /// </summary>
        [Fact]
        public async Task UTCID05_GetUnreadCountAsync_NoNotifications_ReturnsZero()
        {
            // Arrange
            const int userId = 999;

            _mockNotificationRepo
                .Setup(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(0);

            // Act
            var result = await _service.GetUnreadCountAsync(userId);

            // Assert
            Assert.Equal(0, result);
            _mockNotificationRepo.Verify(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
