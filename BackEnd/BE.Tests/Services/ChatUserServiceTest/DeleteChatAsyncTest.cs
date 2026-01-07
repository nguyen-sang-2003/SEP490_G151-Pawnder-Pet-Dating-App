using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatUserServiceTest
{
    public class DeleteChatAsyncTest : IDisposable
    {
        private readonly Mock<IChatUserRepository> _mockChatUserRepo;
        private readonly Mock<DailyLimitService> _mockDailyLimitService;
        private readonly PawnderDatabaseContext _context;
        private readonly ChatUserService _service;

        public DeleteChatAsyncTest()
        {
            _mockChatUserRepo = new Mock<IChatUserRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatUserDeleteChatDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Create a mock for DailyLimitService (it requires PawnderDatabaseContext)
            var limitServiceOptions = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"DailyLimitDb_{Guid.NewGuid()}")
                .Options;
            var limitContext = new PawnderDatabaseContext(limitServiceOptions);
            var dailyLimitService = new DailyLimitService(limitContext);

            _service = new ChatUserService(
                _mockChatUserRepo.Object,
                _context,
                dailyLimitService);

            // Setup repository update mock
            _mockChatUserRepo
                .Setup(r => r.UpdateAsync(It.IsAny<ChatUser>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedChatUser(int matchId, bool isDeleted)
        {
            if (!_context.ChatUsers.Any(c => c.MatchId == matchId))
            {
                _context.ChatUsers.Add(new ChatUser
                {
                    MatchId = matchId,
                    FromPetId = 1,
                    ToPetId = 2,
                    Status = "Accepted",
                    IsDeleted = isDeleted,
                    CreatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: matchId=1 (valid, exists), ChatUserExists=TRUE, IsDeleted=FALSE
        /// -> Trả về TRUE (soft delete thành công).
        /// </summary>
        [Fact]
        public async Task UTCID01_DeleteChatAsync_ValidMatchIdNotDeleted_ReturnsTrue()
        {
            // Arrange
            const int matchId = 1;
            SeedChatUser(matchId, isDeleted: false);

            // Act
            var result = await _service.DeleteChatAsync(matchId);

            // Assert
            Assert.True(result);

            // Verify the chat was soft-deleted
            var updatedChat = await _context.ChatUsers.FirstOrDefaultAsync(c => c.MatchId == matchId);
            Assert.NotNull(updatedChat);
            Assert.True(updatedChat.IsDeleted);
            Assert.NotNull(updatedChat.UpdatedAt);
        }

        /// <summary>
        /// UTCID02: matchId=1 (valid, exists), ChatUserExists=TRUE, IsDeleted=TRUE
        /// -> Trả về FALSE (đã bị xóa trước đó).
        /// </summary>
        [Fact]
        public async Task UTCID02_DeleteChatAsync_ValidMatchIdAlreadyDeleted_ReturnsFalse()
        {
            // Arrange
            const int matchId = 1;
            SeedChatUser(matchId, isDeleted: true);

            // Act
            var result = await _service.DeleteChatAsync(matchId);

            // Assert
            Assert.False(result);
        }

        /// <summary>
        /// UTCID03: matchId=999 (valid, not exists), ChatUserExists=FALSE
        /// -> Trả về FALSE (không tìm thấy).
        /// </summary>
        [Fact]
        public async Task UTCID03_DeleteChatAsync_ValidMatchIdNotExists_ReturnsFalse()
        {
            // Arrange
            const int matchId = 999;
            // No chat seeded

            // Act
            var result = await _service.DeleteChatAsync(matchId);

            // Assert
            Assert.False(result);
        }

        /// <summary>
        /// UTCID04: matchId invalid (0, -1, int.MaxValue, int.MinValue), ChatUserExists=FALSE
        /// -> Trả về FALSE (không tìm thấy).
        /// </summary>
        [Fact]
        public async Task UTCID04_DeleteChatAsync_InvalidMatchId_ReturnsFalse()
        {
            // Arrange
            var invalidMatchIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var matchId in invalidMatchIds)
            {
                // Act
                var result = await _service.DeleteChatAsync(matchId);

                // Assert
                Assert.False(result);
            }
        }
    }
}
