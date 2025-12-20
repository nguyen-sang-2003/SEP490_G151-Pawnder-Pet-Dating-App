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
    public class GetAllNotificationsAsyncTest : IDisposable
    {
        private readonly Mock<INotificationRepository> _mockNotificationRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly NotificationService _service;

        public GetAllNotificationsAsyncTest()
        {
            _mockNotificationRepo = new Mock<INotificationRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"NotificationGetAllDb_{Guid.NewGuid()}")
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
        /// UTCID01: HasNotifications=TRUE, Notification.User not null
        /// -> Trả về IEnumerable<NotificationDto> có dữ liệu.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetAllNotificationsAsync_HasNotifications_ReturnsNotifications()
        {
            // Arrange
            var notifications = new List<NotificationDto>
            {
                new NotificationDto
                {
                    NotificationId = 1,
                    UserId = 1,
                    Title = "Test Notification 1",
                    Message = "Test message 1",
                    UserName = "Test User",
                    CreatedAt = DateTime.Now
                },
                new NotificationDto
                {
                    NotificationId = 2,
                    UserId = 2,
                    Title = "Test Notification 2",
                    Message = "Test message 2",
                    UserName = "Another User",
                    CreatedAt = DateTime.Now
                }
            };

            _mockNotificationRepo
                .Setup(r => r.GetAllNotificationsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(notifications);

            // Act
            var result = await _service.GetAllNotificationsAsync();

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);
            Assert.Equal("Test Notification 1", resultList[0].Title);
            Assert.NotNull(resultList[0].UserName);
        }

        /// <summary>
        /// UTCID02: HasNotifications=FALSE
        /// -> Trả về IEnumerable<NotificationDto> rỗng.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetAllNotificationsAsync_NoNotifications_ReturnsEmptyList()
        {
            // Arrange
            _mockNotificationRepo
                .Setup(r => r.GetAllNotificationsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<NotificationDto>());

            // Act
            var result = await _service.GetAllNotificationsAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: HasNotifications=TRUE, Notification.User là null
        /// -> Trả về IEnumerable<NotificationDto> với UserName có thể là null.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetAllNotificationsAsync_NotificationsWithNullUser_ReturnsNotifications()
        {
            // Arrange
            var notifications = new List<NotificationDto>
            {
                new NotificationDto
                {
                    NotificationId = 1,
                    UserId = 1,
                    Title = "Test Notification",
                    Message = "Test message",
                    UserName = null, // User is null
                    CreatedAt = DateTime.Now
                }
            };

            _mockNotificationRepo
                .Setup(r => r.GetAllNotificationsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(notifications);

            // Act
            var result = await _service.GetAllNotificationsAsync();

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.Null(resultList[0].UserName);
        }
    }
}

