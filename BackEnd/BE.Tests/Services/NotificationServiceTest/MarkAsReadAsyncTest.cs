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
    public class MarkAsReadAsyncTest : IDisposable
    {
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly NotificationService _service;

        public MarkAsReadAsyncTest()
        {
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"NotificationMarkAsReadDb_{Guid.NewGuid()}")
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
        /// UTCID01: NotificationId valid (exists), GetByIdAsync returns entity, IsRead=FALSE
        /// -> Returns TRUE, IsRead updated to true, UpdatedAt updated.
        /// </summary>
        [Fact]
        public async Task UTCID01_MarkAsReadAsync_ExistingUnreadNotification_ReturnsTrue()
        {
            // Arrange
            var notification = new Notification
            {
                NotificationId = 1,
                UserId = 1,
                Title = "Test Title",
                Message = "Test Message",
                Type = "system",
                IsRead = false,
                CreatedAt = DateTime.Now.AddHours(-1),
                UpdatedAt = DateTime.Now.AddHours(-1)
            };

            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(notification);

            _mockNotificationRepo
                .Setup(r => r.UpdateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
                .Callback<Notification, CancellationToken>((n, ct) =>
                {
                    // Verify the notification was updated correctly
                    Assert.True(n.IsRead);
                })
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.MarkAsReadAsync(1);

            // Assert
            Assert.True(result);
            _mockNotificationRepo.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
            _mockNotificationRepo.Verify(r => r.UpdateAsync(notification, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID02: NotificationId valid, IsRead already TRUE (marking read again - idempotent)
        /// -> Returns TRUE.
        /// </summary>
        [Fact]
        public async Task UTCID02_MarkAsReadAsync_AlreadyReadNotification_ReturnsTrue()
        {
            // Arrange
            var notification = new Notification
            {
                NotificationId = 1,
                UserId = 1,
                Title = "Test Title",
                Message = "Test Message",
                Type = "expert_confirmation",
                IsRead = true, // Already read
                CreatedAt = DateTime.Now.AddHours(-1),
                UpdatedAt = DateTime.Now.AddMinutes(-30)
            };

            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(notification);

            _mockNotificationRepo
                .Setup(r => r.UpdateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.MarkAsReadAsync(1);

            // Assert - still returns true (idempotent)
            Assert.True(result);
            _mockNotificationRepo.Verify(r => r.UpdateAsync(notification, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID03: CancellationToken cancelled
        /// -> Throws OperationCanceledException.
        /// </summary>
        [Fact]
        public async Task UTCID03_MarkAsReadAsync_Cancelled_ThrowsOperationCanceledException()
        {
            // Arrange
            var cts = new CancellationTokenSource();
            cts.Cancel();

            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new OperationCanceledException());

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(
                () => _service.MarkAsReadAsync(1, cts.Token));
        }

        /// <summary>
        /// UTCID04: NotificationId invalid (not exists), GetByIdAsync returns null
        /// -> Returns FALSE, Entity unchanged.
        /// </summary>
        [Fact]
        public async Task UTCID04_MarkAsReadAsync_NotExists_ReturnsFalse()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Notification?)null);

            // Act
            var result = await _service.MarkAsReadAsync(999);

            // Assert
            Assert.False(result);
            _mockNotificationRepo.Verify(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
            _mockNotificationRepo.Verify(r => r.UpdateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID05: NotificationId = 0, GetByIdAsync returns null
        /// -> Returns FALSE, Entity unchanged.
        /// </summary>
        [Fact]
        public async Task UTCID05_MarkAsReadAsync_ZeroId_ReturnsFalse()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(0, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Notification?)null);

            // Act
            var result = await _service.MarkAsReadAsync(0);

            // Assert
            Assert.False(result);
            _mockNotificationRepo.Verify(r => r.GetByIdAsync(0, It.IsAny<CancellationToken>()), Times.Once);
            _mockNotificationRepo.Verify(r => r.UpdateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }
}
