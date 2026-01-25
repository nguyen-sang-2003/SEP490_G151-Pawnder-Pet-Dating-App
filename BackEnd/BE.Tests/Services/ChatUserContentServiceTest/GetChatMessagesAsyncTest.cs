using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatUserContentServiceTest
{
    public class GetChatMessagesAsyncTest : IDisposable
    {
        private readonly Mock<IChatUserContentRepository> _mockContentRepo;
        private readonly Mock<IChatUserRepository> _mockChatUserRepo;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly Mock<IBadWordService> _mockBadWordService;
        private readonly PawnderDatabaseContext _context;
        private readonly ChatUserContentService _service;

        public GetChatMessagesAsyncTest()
        {
            _mockContentRepo = new Mock<IChatUserContentRepository>();
            _mockChatUserRepo = new Mock<IChatUserRepository>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();
            _mockBadWordService = new Mock<IBadWordService>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatUserContentGetMessagesDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new ChatUserContentService(
                _mockContentRepo.Object,
                _mockChatUserRepo.Object,
                _context,
                _mockHubContext.Object,
                _mockBadWordService.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: matchId=1 (valid, exists), ChatUserExists=TRUE, Status="Accepted", IsDeleted=FALSE, HasMessages=TRUE
        /// -> Trả về IEnumerable<object> (not empty) với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetChatMessagesAsync_ValidMatchIdWithMessages_ReturnsNonEmptyList()
        {
            // Arrange
            const int matchId = 1;
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            // Mock ChatExistsAsync returns true
            _mockContentRepo
                .Setup(r => r.ChatExistsAsync(matchId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Mock GetChatMessagesAsync returns list with messages
            var mockMessages = new List<object>
            {
                new
                {
                    ContentId = 1,
                    MatchId = matchId,
                    FromUserId = 10,
                    FromUserName = "Test User",
                    Message = "Hello there!",
                    CreatedAt = now
                }
            };

            _mockContentRepo
                .Setup(r => r.GetChatMessagesAsync(matchId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockMessages);

            // Act
            var result = await _service.GetChatMessagesAsync(matchId);

            // Assert
            var resultList = result.ToList();
            Assert.NotEmpty(resultList);
            Assert.Single(resultList);

            var firstMessage = resultList[0];
            var type = firstMessage.GetType();

            // Verify response properties
            Assert.NotNull(type.GetProperty("ContentId")!.GetValue(firstMessage));
            Assert.Equal(matchId, (int)type.GetProperty("MatchId")!.GetValue(firstMessage)!);
            Assert.NotNull(type.GetProperty("FromUserId")!.GetValue(firstMessage));
            Assert.NotNull(type.GetProperty("FromUserName")!.GetValue(firstMessage));
            Assert.NotNull(type.GetProperty("Message")!.GetValue(firstMessage));
            Assert.NotNull(type.GetProperty("CreatedAt")!.GetValue(firstMessage));
        }

        /// <summary>
        /// UTCID02: matchId=1 (valid, exists), ChatUserExists=TRUE, Status="Accepted", IsDeleted=FALSE, HasMessages=FALSE
        /// -> Trả về IEnumerable<object> (empty).
        /// </summary>
        [Fact]
        public async Task UTCID02_GetChatMessagesAsync_ValidMatchIdWithoutMessages_ReturnsEmptyList()
        {
            // Arrange
            const int matchId = 1;

            // Mock ChatExistsAsync returns true
            _mockContentRepo
                .Setup(r => r.ChatExistsAsync(matchId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Mock GetChatMessagesAsync returns empty list
            _mockContentRepo
                .Setup(r => r.GetChatMessagesAsync(matchId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<object>());

            // Act
            var result = await _service.GetChatMessagesAsync(matchId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: matchId=999 (valid, not exists), ChatUserExists=FALSE
        /// -> Ném KeyNotFoundException với message "Không tìm thấy đoạn chat."
        /// </summary>
        [Fact]
        public async Task UTCID03_GetChatMessagesAsync_ValidMatchIdNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int matchId = 999;

            // Mock ChatExistsAsync returns false
            _mockContentRepo
                .Setup(r => r.ChatExistsAsync(matchId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.GetChatMessagesAsync(matchId));

            Assert.Equal("Không tìm thấy đoạn chat.", ex.Message);

            // Verify GetChatMessagesAsync was NOT called (early return)
            _mockContentRepo.Verify(
                r => r.GetChatMessagesAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        /// <summary>
        /// UTCID04: matchId invalid (0, -1, int.MaxValue, int.MinValue), ChatUserExists=FALSE
        /// -> Ném KeyNotFoundException với message "Không tìm thấy đoạn chat."
        /// </summary>
        [Fact]
        public async Task UTCID04_GetChatMessagesAsync_InvalidMatchId_ThrowsKeyNotFoundException()
        {
            // Arrange
            var invalidMatchIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var matchId in invalidMatchIds)
            {
                // Mock ChatExistsAsync returns false for invalid IDs
                _mockContentRepo
                    .Setup(r => r.ChatExistsAsync(matchId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(false);

                // Act & Assert
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.GetChatMessagesAsync(matchId));

                Assert.Equal("Không tìm thấy đoạn chat.", ex.Message);
            }
        }
    }
}
