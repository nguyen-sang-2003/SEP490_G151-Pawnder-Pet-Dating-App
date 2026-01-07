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
    public class GetNotificationsByUserIdAsyncTest : IDisposable
    {
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly NotificationService _service;

        public GetNotificationsByUserIdAsyncTest()
        {
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"NotificationGetByUserIdDb_{Guid.NewGuid()}")
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
        /// UTCID01: Valid userId with notifications, returns list with multiple items
        /// -> Returns IEnumerable with Count > 0.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetNotificationsByUserIdAsync_WithNotifications_ReturnsMultiple()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification
                {
                    NotificationId = 1,
                    UserId = 1,
                    Title = "Test Title 1",
                    Message = "Test Message 1",
                    Type = "system",
                    IsRead = false,
                    CreatedAt = DateTime.Now.AddHours(-1),
                    UpdatedAt = DateTime.Now
                },
                new Notification
                {
                    NotificationId = 2,
                    UserId = 1,
                    Title = "Test Title 2",
                    Message = "Test Message 2",
                    Type = "expert_confirmation",
                    IsRead = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            };

            _mockNotificationRepo
                .Setup(r => r.GetNotificationsByUserIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(notifications);

            // Act
            var result = await _service.GetNotificationsByUserIdAsync(1);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.True(resultList.Count > 0);
            Assert.Equal(2, resultList.Count);

            _mockNotificationRepo.Verify(r => r.GetNotificationsByUserIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID02: Valid userId, no notifications
        /// -> Returns empty IEnumerable.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetNotificationsByUserIdAsync_NoNotifications_ReturnsEmpty()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetNotificationsByUserIdAsync(999, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Notification>());

            // Act
            var result = await _service.GetNotificationsByUserIdAsync(999);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);

            _mockNotificationRepo.Verify(r => r.GetNotificationsByUserIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID03: CancellationToken cancelled
        /// -> Throws OperationCanceledException.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetNotificationsByUserIdAsync_Cancelled_ThrowsOperationCanceledException()
        {
            // Arrange
            var cts = new CancellationTokenSource();
            cts.Cancel();

            _mockNotificationRepo
                .Setup(r => r.GetNotificationsByUserIdAsync(1, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new OperationCanceledException());

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(
                () => _service.GetNotificationsByUserIdAsync(1, cts.Token));
        }

        /// <summary>
        /// UTCID04: userId = 0, returns empty
        /// -> Returns empty IEnumerable.
        /// </summary>
        [Fact]
        public async Task UTCID04_GetNotificationsByUserIdAsync_ZeroUserId_ReturnsEmpty()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetNotificationsByUserIdAsync(0, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Notification>());

            // Act
            var result = await _service.GetNotificationsByUserIdAsync(0);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);

            _mockNotificationRepo.Verify(r => r.GetNotificationsByUserIdAsync(0, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID05: Negative userId, returns empty
        /// -> Returns empty IEnumerable.
        /// </summary>
        [Fact]
        public async Task UTCID05_GetNotificationsByUserIdAsync_NegativeUserId_ReturnsEmpty()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetNotificationsByUserIdAsync(-1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Notification>());

            // Act
            var result = await _service.GetNotificationsByUserIdAsync(-1);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);

            _mockNotificationRepo.Verify(r => r.GetNotificationsByUserIdAsync(-1, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
