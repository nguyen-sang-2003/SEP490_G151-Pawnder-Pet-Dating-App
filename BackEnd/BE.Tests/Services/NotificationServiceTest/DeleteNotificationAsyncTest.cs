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
    public class DeleteNotificationAsyncTest : IDisposable
    {
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly NotificationService _service;

        public DeleteNotificationAsyncTest()
        {
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"NotificationDeleteDb_{Guid.NewGuid()}")
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
        /// UTCID01: NotificationId valid (exists), GetByIdAsync returns entity, CancellationToken not cancelled
        /// -> Returns TRUE, DeleteAsync called.
        /// </summary>
        [Fact]
        public async Task UTCID01_DeleteNotificationAsync_ExistingNotification_ReturnsTrue()
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
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(notification);

            _mockNotificationRepo
                .Setup(r => r.DeleteAsync(notification, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.DeleteNotificationAsync(1);

            // Assert
            Assert.True(result);
            _mockNotificationRepo.Verify(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
            _mockNotificationRepo.Verify(r => r.DeleteAsync(notification, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID02: NotificationId invalid (not exists), GetByIdAsync returns null
        /// -> Returns FALSE, GetByIdAsync called but DeleteAsync NOT called.
        /// </summary>
        [Fact]
        public async Task UTCID02_DeleteNotificationAsync_NotExists_ReturnsFalse()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Notification?)null);

            // Act
            var result = await _service.DeleteNotificationAsync(999);

            // Assert
            Assert.False(result);
            _mockNotificationRepo.Verify(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
            _mockNotificationRepo.Verify(r => r.DeleteAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID03: CancellationToken cancelled
        /// -> Throws OperationCanceledException.
        /// </summary>
        [Fact]
        public async Task UTCID03_DeleteNotificationAsync_Cancelled_ThrowsOperationCanceledException()
        {
            // Arrange
            var cts = new CancellationTokenSource();
            cts.Cancel();

            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new OperationCanceledException());

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(
                () => _service.DeleteNotificationAsync(1, cts.Token));
        }

        /// <summary>
        /// UTCID04: NotificationId = 0, GetByIdAsync returns null
        /// -> Returns FALSE.
        /// </summary>
        [Fact]
        public async Task UTCID04_DeleteNotificationAsync_ZeroId_ReturnsFalse()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(0, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Notification?)null);

            // Act
            var result = await _service.DeleteNotificationAsync(0);

            // Assert
            Assert.False(result);
            _mockNotificationRepo.Verify(r => r.GetByIdAsync(0, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID05: NotificationId negative, GetByIdAsync returns null
        /// -> Returns FALSE.
        /// </summary>
        [Fact]
        public async Task UTCID05_DeleteNotificationAsync_NegativeId_ReturnsFalse()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetByIdAsync(-1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Notification?)null);

            // Act
            var result = await _service.DeleteNotificationAsync(-1);

            // Assert
            Assert.False(result);
            _mockNotificationRepo.Verify(r => r.GetByIdAsync(-1, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
