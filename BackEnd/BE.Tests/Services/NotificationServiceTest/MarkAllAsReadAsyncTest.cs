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
    public class MarkAllAsReadAsyncTest : IDisposable
    {
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly NotificationService _service;

        public MarkAllAsReadAsyncTest()
        {
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"NotificationMarkAllAsReadDb_{Guid.NewGuid()}")
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
        /// UTCID01: UserId valid, has unread notifications
        /// -> Returns count > 0, all notifications marked as read.
        /// </summary>
        [Fact]
        public async Task UTCID01_MarkAllAsReadAsync_HasUnreadNotifications_ReturnsCount()
        {
            // Arrange
            const int userId = 1;
            const int markedCount = 5;

            _mockNotificationRepo
                .Setup(r => r.MarkAllAsReadAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(markedCount);

            // Act
            var result = await _service.MarkAllAsReadAsync(userId);

            // Assert
            Assert.True(result > 0);
            Assert.Equal(markedCount, result);
            _mockNotificationRepo.Verify(r => r.MarkAllAsReadAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID02: UserId valid, all notifications already read
        /// -> Returns 0, no notifications updated.
        /// </summary>
        [Fact]
        public async Task UTCID02_MarkAllAsReadAsync_AllAlreadyRead_ReturnsZero()
        {
            // Arrange
            const int userId = 1;

            _mockNotificationRepo
                .Setup(r => r.MarkAllAsReadAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(0); // No unread notifications

            // Act
            var result = await _service.MarkAllAsReadAsync(userId);

            // Assert
            Assert.Equal(0, result);
            _mockNotificationRepo.Verify(r => r.MarkAllAsReadAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID03: CancellationToken cancelled
        /// -> Throws OperationCanceledException.
        /// </summary>
        [Fact]
        public async Task UTCID03_MarkAllAsReadAsync_Cancelled_ThrowsOperationCanceledException()
        {
            // Arrange
            var cts = new CancellationTokenSource();
            cts.Cancel();

            _mockNotificationRepo
                .Setup(r => r.MarkAllAsReadAsync(1, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new OperationCanceledException());

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(
                () => _service.MarkAllAsReadAsync(1, cts.Token));
        }

        /// <summary>
        /// UTCID04: UserId invalid (not exists in system), no notifications
        /// -> Returns 0.
        /// </summary>
        [Fact]
        public async Task UTCID04_MarkAllAsReadAsync_UserNotExists_ReturnsZero()
        {
            // Arrange
            const int userId = 999;

            _mockNotificationRepo
                .Setup(r => r.MarkAllAsReadAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(0);

            // Act
            var result = await _service.MarkAllAsReadAsync(userId);

            // Assert
            Assert.Equal(0, result);
            _mockNotificationRepo.Verify(r => r.MarkAllAsReadAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID05: UserId = 0
        /// -> Returns 0.
        /// </summary>
        [Fact]
        public async Task UTCID05_MarkAllAsReadAsync_ZeroUserId_ReturnsZero()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.MarkAllAsReadAsync(0, It.IsAny<CancellationToken>()))
                .ReturnsAsync(0);

            // Act
            var result = await _service.MarkAllAsReadAsync(0);

            // Assert
            Assert.Equal(0, result);
            _mockNotificationRepo.Verify(r => r.MarkAllAsReadAsync(0, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
