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
    public class GetAllExpertConfirmationsAsyncTest : IDisposable
    {
        private readonly Mock<IExpertConfirmationRepository> _mockExpertConfirmationRepo;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly ExpertConfirmationService _service;

        public GetAllExpertConfirmationsAsyncTest()
        {
            _mockExpertConfirmationRepo = new Mock<IExpertConfirmationRepository>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ExpertConfirmationGetAllDb_{Guid.NewGuid()}")
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
        /// UTCID01: HasExpertConfirmations=TRUE
        /// -> Trả về IEnumerable<ExpertConfirmationDTO> (not empty) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetAllExpertConfirmationsAsync_HasConfirmations_ReturnsNonEmptyList()
        {
            // Arrange
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var mockConfirmations = new List<ExpertConfirmationDTO>
            {
                new ExpertConfirmationDTO
                {
                    UserId = 1,
                    ChatAiId = 10,
                    ExpertId = 2,
                    Status = "pending",
                    Message = "Test message",
                    UserQuestion = "Test question",
                    CreatedAt = now,
                    UpdatedAt = now
                }
            };

            _mockExpertConfirmationRepo
                .Setup(r => r.GetAllExpertConfirmationsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockConfirmations);

            // Act
            var result = await _service.GetAllExpertConfirmationsAsync();

            // Assert
            var resultList = result.ToList();
            Assert.NotEmpty(resultList);
            Assert.Single(resultList);

            var firstConfirmation = resultList[0];

            // Verify response properties
            Assert.NotNull(firstConfirmation.UserId);
            Assert.NotNull(firstConfirmation.ChatAiId);
            Assert.NotNull(firstConfirmation.ExpertId);
            // Status, Message, UserQuestion, CreatedAt, UpdatedAt are nullable
            Assert.Equal("pending", firstConfirmation.Status);
            Assert.Equal("Test message", firstConfirmation.Message);
            Assert.Equal("Test question", firstConfirmation.UserQuestion);
            Assert.NotNull(firstConfirmation.CreatedAt);
            Assert.NotNull(firstConfirmation.UpdatedAt);
        }

        /// <summary>
        /// UTCID02: HasExpertConfirmations=FALSE
        /// -> Trả về IEnumerable<ExpertConfirmationDTO> (empty).
        /// </summary>
        [Fact]
        public async Task UTCID02_GetAllExpertConfirmationsAsync_NoConfirmations_ReturnsEmptyList()
        {
            // Arrange
            _mockExpertConfirmationRepo
                .Setup(r => r.GetAllExpertConfirmationsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<ExpertConfirmationDTO>());

            // Act
            var result = await _service.GetAllExpertConfirmationsAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }
}
