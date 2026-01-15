using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatExpertContentServiceTest
{
    public class GetChatMessagesAsyncTest : IDisposable
    {
        private readonly Mock<IChatExpertContentRepository> _mockContentRepo;
        private readonly Mock<IChatExpertRepository> _mockChatExpertRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly Mock<IDailyLimitService> _mockDailyLimitService;
        private readonly Mock<IBadWordService> _mockBadWordService;
        private readonly PawnderDatabaseContext _context;
        private readonly ChatExpertContentService _service;

        public GetChatMessagesAsyncTest()
        {
            _mockContentRepo = new Mock<IChatExpertContentRepository>();
            _mockChatExpertRepo = new Mock<IChatExpertRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();
            _mockDailyLimitService = new Mock<IDailyLimitService>();
            _mockBadWordService = new Mock<IBadWordService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatExpertContentGetMessagesDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new ChatExpertContentService(
                _mockContentRepo.Object,
                _mockChatExpertRepo.Object,
                _context,
                _mockHubContext.Object,
                _mockDailyLimitService.Object,
                _mockBadWordService.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: chatExpertId=1 (valid, exists), ChatExpertExists=TRUE, HasMessages=TRUE
        /// -> Trả về IEnumerable<object> (not empty) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetChatMessagesAsync_ValidIdWithMessages_ReturnsNonEmptyList()
        {
            // Arrange
            const int chatExpertId = 1;
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            // Mock ChatExpertExists returns true
            _mockContentRepo
                .Setup(r => r.ChatExpertExistsAsync(chatExpertId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Mock GetChatMessagesAsync returns list with messages
            var mockMessages = new List<object>
            {
                new
                {
                    contentId = 1,
                    chatExpertId = chatExpertId,
                    fromId = 10,
                    fromName = "Expert Name",
                    fromEmail = "expert@test.com",
                    message = "Hello, how can I help?",
                    expertId = (int?)null,
                    userId = (int?)null,
                    chatAiid = (int?)null,
                    expertConfirmation = (object?)null,
                    createdAt = now,
                    updatedAt = now
                }
            };

            _mockContentRepo
                .Setup(r => r.GetChatMessagesAsync(chatExpertId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockMessages);

            // Act
            var result = await _service.GetChatMessagesAsync(chatExpertId);

            // Assert
            var resultList = result.ToList();
            Assert.NotEmpty(resultList);
            Assert.Single(resultList);

            var firstMessage = resultList[0];
            var type = firstMessage.GetType();

            // Verify response properties
            Assert.NotNull(type.GetProperty("contentId")!.GetValue(firstMessage));
            Assert.Equal(chatExpertId, (int)type.GetProperty("chatExpertId")!.GetValue(firstMessage)!);
            Assert.NotNull(type.GetProperty("fromId")!.GetValue(firstMessage));
            Assert.NotNull(type.GetProperty("fromName")!.GetValue(firstMessage));
            Assert.NotNull(type.GetProperty("fromEmail")!.GetValue(firstMessage));
            Assert.NotNull(type.GetProperty("message")!.GetValue(firstMessage));
            Assert.NotNull(type.GetProperty("createdAt")!.GetValue(firstMessage));
            Assert.NotNull(type.GetProperty("updatedAt")!.GetValue(firstMessage));

            // These can be nullable
            Assert.True(type.GetProperty("expertId") != null);
            Assert.True(type.GetProperty("userId") != null);
            Assert.True(type.GetProperty("chatAiid") != null);
            Assert.True(type.GetProperty("expertConfirmation") != null);
        }

        /// <summary>
        /// UTCID02: chatExpertId=1 (valid, exists), ChatExpertExists=TRUE, HasMessages=FALSE
        /// -> Trả về IEnumerable<object> (empty).
        /// </summary>
        [Fact]
        public async Task UTCID02_GetChatMessagesAsync_ValidIdWithoutMessages_ReturnsEmptyList()
        {
            // Arrange
            const int chatExpertId = 1;

            // Mock ChatExpertExists returns true
            _mockContentRepo
                .Setup(r => r.ChatExpertExistsAsync(chatExpertId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Mock GetChatMessagesAsync returns empty list
            _mockContentRepo
                .Setup(r => r.GetChatMessagesAsync(chatExpertId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<object>());

            // Act
            var result = await _service.GetChatMessagesAsync(chatExpertId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: chatExpertId=999 (valid, not exists), ChatExpertExists=FALSE
        /// -> Ném KeyNotFoundException với message "Không tìm thấy đoạn chat.".
        /// </summary>
        [Fact]
        public async Task UTCID03_GetChatMessagesAsync_ValidIdNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int chatExpertId = 999;

            // Mock ChatExpertExists returns false
            _mockContentRepo
                .Setup(r => r.ChatExpertExistsAsync(chatExpertId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetChatMessagesAsync(chatExpertId));

            Assert.Equal("Không tìm thấy đoạn chat.", ex.Message);

            // Verify GetChatMessagesAsync was NOT called (early return)
            _mockContentRepo.Verify(
                r => r.GetChatMessagesAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: chatExpertId invalid (0, -1, int.MaxValue, int.MinValue), ChatExpertExists=FALSE
        /// -> Ném KeyNotFoundException với message "Không tìm thấy đoạn chat.".
        /// </summary>
        [Fact]
        public async Task UTCID04_GetChatMessagesAsync_InvalidId_ThrowsKeyNotFoundException()
        {
            // Arrange
            var invalidChatExpertIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var chatExpertId in invalidChatExpertIds)
            {
                // Mock ChatExpertExists returns false for invalid IDs
                _mockContentRepo
                    .Setup(r => r.ChatExpertExistsAsync(chatExpertId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(false);

                // Act & Assert
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.GetChatMessagesAsync(chatExpertId));

                Assert.Equal("Không tìm thấy đoạn chat.", ex.Message);
            }
        }
    }
}
