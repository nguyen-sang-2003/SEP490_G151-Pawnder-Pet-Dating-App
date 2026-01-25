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
    public class GetExpertConfirmationAsyncTest : IDisposable
    {
        private readonly Mock<IExpertConfirmationRepository> _mockExpertConfirmationRepo;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly ExpertConfirmationService _service;

        public GetExpertConfirmationAsyncTest()
        {
            _mockExpertConfirmationRepo = new Mock<IExpertConfirmationRepository>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ExpertConfirmationGetDb_{Guid.NewGuid()}")
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
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: expertId=1, userId=1, chatId=1 (all valid, exists), ExpertConfirmationExists=TRUE
        /// -> Trả về ExpertConfirmationDTO (not null) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetExpertConfirmationAsync_ValidIdsAndExists_ReturnsDTO()
        {
            // Arrange
            const int expertId = 1;
            const int userId = 1;
            const int chatId = 1;
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            var mockConfirmation = new ExpertConfirmation
            {
                ExpertId = expertId,
                UserId = userId,
                ChatAiid = chatId,
                Status = "pending",
                Message = "Test message",
                UserQuestion = "Test question",
                CreatedAt = now,
                UpdatedAt = now
            };

            _mockExpertConfirmationRepo
                .Setup(r => r.GetExpertConfirmationAsync(expertId, userId, chatId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockConfirmation);

            // Act
            var result = await _service.GetExpertConfirmationAsync(expertId, userId, chatId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(chatId, result.ChatAiId);
            Assert.Equal(expertId, result.ExpertId);
            // Nullable properties
            Assert.Equal("pending", result.Status);
            Assert.Equal("Test message", result.Message);
            Assert.Equal("Test question", result.UserQuestion);
            Assert.NotNull(result.CreatedAt);
            Assert.NotNull(result.UpdatedAt);
        }

        /// <summary>
        /// UTCID02: expertId=1, userId=1, chatId=1 (all valid), ExpertConfirmationExists=FALSE
        /// -> Trả về null.
        /// </summary>
        [Fact]
        public async Task UTCID02_GetExpertConfirmationAsync_ValidIdsButNotExists_ReturnsNull()
        {
            // Arrange
            const int expertId = 1;
            const int userId = 1;
            const int chatId = 1;

            _mockExpertConfirmationRepo
                .Setup(r => r.GetExpertConfirmationAsync(expertId, userId, chatId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((ExpertConfirmation?)null);

            // Act
            var result = await _service.GetExpertConfirmationAsync(expertId, userId, chatId);

            // Assert
            Assert.Null(result);
        }

        /// <summary>
        /// UTCID03: expertId, userId, chatId invalid (0, -1, int.MaxValue, int.MinValue)
        /// -> Trả về null (không tìm thấy).
        /// </summary>
        [Fact]
        public async Task UTCID03_GetExpertConfirmationAsync_InvalidIds_ReturnsNull()
        {
            // Arrange
            var invalidIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var invalidId in invalidIds)
            {
                // Test with invalid expertId
                _mockExpertConfirmationRepo
                    .Setup(r => r.GetExpertConfirmationAsync(invalidId, 1, 1, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((ExpertConfirmation?)null);

                var result1 = await _service.GetExpertConfirmationAsync(invalidId, 1, 1);
                Assert.Null(result1);

                // Test with invalid userId
                _mockExpertConfirmationRepo
                    .Setup(r => r.GetExpertConfirmationAsync(1, invalidId, 1, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((ExpertConfirmation?)null);

                var result2 = await _service.GetExpertConfirmationAsync(1, invalidId, 1);
                Assert.Null(result2);

                // Test with invalid chatId
                _mockExpertConfirmationRepo
                    .Setup(r => r.GetExpertConfirmationAsync(1, 1, invalidId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync((ExpertConfirmation?)null);

                var result3 = await _service.GetExpertConfirmationAsync(1, 1, invalidId);
                Assert.Null(result3);
            }
        }
    }
}
