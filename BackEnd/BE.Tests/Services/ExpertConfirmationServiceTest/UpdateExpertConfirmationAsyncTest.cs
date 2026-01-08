using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ExpertConfirmationServiceTest
{
    public class UpdateExpertConfirmationAsyncTest : IDisposable
    {
        private readonly Mock<IExpertConfirmationRepository> _mockExpertConfirmationRepo;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly ExpertConfirmationService _service;

        public UpdateExpertConfirmationAsyncTest()
        {
            _mockExpertConfirmationRepo = new Mock<IExpertConfirmationRepository>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ExpertConfirmationUpdateDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Create DailyLimitService
            var limitServiceOptions = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"DailyLimitDb_{Guid.NewGuid()}")
                .Options;
            var limitContext = new PawnderDatabaseContext(limitServiceOptions);
            var dailyLimitService = new DailyLimitService(limitContext);

            _service = new ExpertConfirmationService(
                _mockExpertConfirmationRepo.Object,
                _context,
                dailyLimitService,
                _mockNotificationService.Object,
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

            // Setup repository UpdateAsync mock
            _mockExpertConfirmationRepo
                .Setup(r => r.UpdateAsync(It.IsAny<ExpertConfirmation>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Setup NotificationService mock
            _mockNotificationService
                .Setup(n => n.CreateNotificationAsync(It.IsAny<NotificationDto_1>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Notification { NotificationId = 1 });
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId, string email, int roleId = 3, string fullName = "Test User")
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = email,
                    FullName = fullName,
                    PasswordHash = "hash",
                    RoleId = roleId,
                    UserStatusId = 2,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: ExpertId valid, UserId valid, ChatId valid, ExpertConfirmation exists,
        /// Status="confirmed", Current Status="pending", Notification Created=yes
        /// -> Trả về ExpertConfirmationResponseDTO với các properties được cập nhật.
        /// </summary>
        [Fact]
        public async Task UTCID01_UpdateExpertConfirmationAsync_ConfirmedStatus_CreatesNotificationAndReturnsDTO()
        {
            // Arrange
            const int expertId = 2;
            const int userId = 1;
            const int chatId = 1;
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            SeedUser(expertId, "expert@test.com", 2, "Expert User");

            var existingConfirmation = new ExpertConfirmation
            {
                ExpertId = expertId,
                UserId = userId,
                ChatAiid = chatId,
                Status = "pending",
                Message = null,
                UserQuestion = "Test question",
                CreatedAt = now,
                UpdatedAt = now
            };

            _mockExpertConfirmationRepo
                .Setup(r => r.GetExpertConfirmationAsync(expertId, userId, chatId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(existingConfirmation);

            var updateDto = new ExpertConfirmationUpdateDto
            {
                Status = "confirmed",
                Message = "Expert response message"
            };

            // Act
            var result = await _service.UpdateExpertConfirmationAsync(expertId, userId, chatId, updateDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(chatId, result.ChatAiId);
            Assert.Equal(expertId, result.ExpertId);
            Assert.Equal("confirmed", result.Status);
            Assert.Equal("Expert response message", result.Message);
            Assert.Equal("Cập nhật yêu cầu confirm thành công", result.ResultMessage);
            Assert.NotNull(result.UpdatedAt);

            // Verify notification was created
            _mockNotificationService.Verify(
                n => n.CreateNotificationAsync(It.IsAny<NotificationDto_1>(), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        /// <summary>
        /// UTCID02: ExpertId valid, UserId valid, ChatId valid, ExpertConfirmation exists,
        /// Status="rejected", Current Status="pending", Notification Created=no
        /// -> Trả về ExpertConfirmationResponseDTO với các properties được cập nhật.
        /// </summary>
        [Fact]
        public async Task UTCID02_UpdateExpertConfirmationAsync_RejectedStatus_ReturnsDTO()
        {
            // Arrange
            const int expertId = 2;
            const int userId = 1;
            const int chatId = 1;
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            SeedUser(expertId, "expert@test.com", 2, "Expert User");

            var existingConfirmation = new ExpertConfirmation
            {
                ExpertId = expertId,
                UserId = userId,
                ChatAiid = chatId,
                Status = "pending",
                Message = null,
                UserQuestion = "Test question",
                CreatedAt = now,
                UpdatedAt = now
            };

            _mockExpertConfirmationRepo
                .Setup(r => r.GetExpertConfirmationAsync(expertId, userId, chatId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(existingConfirmation);

            var updateDto = new ExpertConfirmationUpdateDto
            {
                Status = "rejected",
                Message = "Expert rejection message"
            };

            // Act
            var result = await _service.UpdateExpertConfirmationAsync(expertId, userId, chatId, updateDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(chatId, result.ChatAiId);
            Assert.Equal(expertId, result.ExpertId);
            Assert.Equal("rejected", result.Status);
            Assert.Equal("Expert rejection message", result.Message);
            Assert.Equal("Cập nhật yêu cầu confirm thành công", result.ResultMessage);
            Assert.NotNull(result.UpdatedAt);

            // Verify notification was NOT created (rejected status doesn't trigger notification)
            _mockNotificationService.Verify(
                n => n.CreateNotificationAsync(It.IsAny<NotificationDto_1>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID03: ExpertId valid, UserId valid, ChatId valid, ExpertConfirmation exists,
        /// Status=null/empty or provided, Current Status="pending" or already "confirmed", Notification Created=no
        /// -> Trả về ExpertConfirmationResponseDTO với các properties được cập nhật.
        /// </summary>
        [Fact]
        public async Task UTCID03_UpdateExpertConfirmationAsync_AlreadyConfirmed_ReturnsDTO()
        {
            // Arrange
            const int expertId = 2;
            const int userId = 1;
            const int chatId = 1;
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            SeedUser(expertId, "expert@test.com", 2, "Expert User");

            var existingConfirmation = new ExpertConfirmation
            {
                ExpertId = expertId,
                UserId = userId,
                ChatAiid = chatId,
                Status = "confirmed", // Already confirmed
                Message = "Previous message",
                UserQuestion = "Test question",
                CreatedAt = now,
                UpdatedAt = now
            };

            _mockExpertConfirmationRepo
                .Setup(r => r.GetExpertConfirmationAsync(expertId, userId, chatId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(existingConfirmation);

            var updateDto = new ExpertConfirmationUpdateDto
            {
                Status = "confirmed", // Same status - should not trigger notification
                Message = "Updated message"
            };

            // Act
            var result = await _service.UpdateExpertConfirmationAsync(expertId, userId, chatId, updateDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(chatId, result.ChatAiId);
            Assert.Equal(expertId, result.ExpertId);
            Assert.Equal("confirmed", result.Status);
            Assert.Equal("Updated message", result.Message);
            Assert.Equal("Cập nhật yêu cầu confirm thành công", result.ResultMessage);
            Assert.NotNull(result.UpdatedAt);

            // Verify notification was NOT created (already confirmed)
            _mockNotificationService.Verify(
                n => n.CreateNotificationAsync(It.IsAny<NotificationDto_1>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: ExpertConfirmation not exists
        /// -> Ném KeyNotFoundException với message "Yêu cầu xác nhận không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID04_UpdateExpertConfirmationAsync_ConfirmationNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int expertId = 2;
            const int userId = 1;
            const int chatId = 1;

            _mockExpertConfirmationRepo
                .Setup(r => r.GetExpertConfirmationAsync(expertId, userId, chatId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((ExpertConfirmation?)null);

            var updateDto = new ExpertConfirmationUpdateDto
            {
                Status = "confirmed",
                Message = "Test message"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.UpdateExpertConfirmationAsync(expertId, userId, chatId, updateDto));

            Assert.Equal("Yêu cầu xác nhận không tồn tại.", ex.Message);
        }
    }
}
