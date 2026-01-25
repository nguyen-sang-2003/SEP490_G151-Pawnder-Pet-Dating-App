using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.ChatExpertServiceTest
{
    public class CreateChatAsyncTest : IDisposable
    {
        private readonly Mock<IChatExpertRepository> _mockChatExpertRepo;
        private readonly PawnderDatabaseContext _context;
        private readonly ChatExpertService _service;

        public CreateChatAsyncTest()
        {
            _mockChatExpertRepo = new Mock<IChatExpertRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ChatExpertCreateChatDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new ChatExpertService(_mockChatExpertRepo.Object, _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUser(int userId, string email)
        {
            _context.Users.Add(new User
            {
                UserId = userId,
                Email = email,
                PasswordHash = "hash",
                UserStatusId = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            _context.SaveChanges();
        }

        /// <summary>
        /// UTCID01: expertId=1, userId=2, cả hai tồn tại, chat đã tồn tại -> trả về chat hiện có (object existing chat).
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateChatAsync_ExistingChat_ReturnsExistingChatObject()
        {
            const int expertId = 1;
            const int userId = 2;
            SeedUser(expertId, "expert1@test.com");
            SeedUser(userId, "user2@test.com");

            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var existingChat = new ChatExpert
            {
                ChatExpertId = 10,
                ExpertId = expertId,
                UserId = userId,
                CreatedAt = now,
                UpdatedAt = now
            };

            _mockChatExpertRepo
                .Setup(r => r.GetChatExpertByExpertAndUserAsync(expertId, userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(existingChat);

            var result = await _service.CreateChatAsync(expertId, userId);
            var type = result.GetType();

            Assert.Equal(10, (int)type.GetProperty("ChatExpertId")!.GetValue(result)!);
            Assert.Equal(expertId, (int)type.GetProperty("ExpertId")!.GetValue(result)!);
            Assert.Equal(userId, (int)type.GetProperty("UserId")!.GetValue(result)!);
            Assert.Equal(now, (DateTime?)type.GetProperty("CreatedAt")!.GetValue(result)!);

            _mockChatExpertRepo.Verify(r => r.AddAsync(It.IsAny<ChatExpert>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID02: expertId=1, userId=2, cả hai tồn tại, chưa có chat -> tạo chat mới và trả về object new chat.
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateChatAsync_NewChat_ReturnsNewChatObject()
        {
            const int expertId = 1;
            const int userId = 2;
            SeedUser(expertId, "expert1@test.com");
            SeedUser(userId, "user2@test.com");

            _mockChatExpertRepo
                .Setup(r => r.GetChatExpertByExpertAndUserAsync(expertId, userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((ChatExpert?)null);

            ChatExpert? savedChat = null;
            _mockChatExpertRepo
                .Setup(r => r.AddAsync(It.IsAny<ChatExpert>(), It.IsAny<CancellationToken>()))
                .Callback<ChatExpert, CancellationToken>((c, _) =>
                {
                    c.ChatExpertId = 20;
                    savedChat = c;
                })
                .ReturnsAsync((ChatExpert c, CancellationToken _) => c);

            var result = await _service.CreateChatAsync(expertId, userId);
            var type = result.GetType();

            Assert.Equal(20, (int)type.GetProperty("ChatExpertId")!.GetValue(result)!);
            Assert.Equal(expertId, (int)type.GetProperty("ExpertId")!.GetValue(result)!);
            Assert.Equal(userId, (int)type.GetProperty("UserId")!.GetValue(result)!);
            Assert.NotNull((DateTime?)type.GetProperty("CreatedAt")!.GetValue(result)!);

            Assert.NotNull(savedChat);
            Assert.Equal(expertId, savedChat!.ExpertId);
            Assert.Equal(userId, savedChat.UserId);

            _mockChatExpertRepo.Verify(r => r.AddAsync(It.IsAny<ChatExpert>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID03: expertId=999 không tồn tại -> ném KeyNotFoundException "Không tìm thấy chuyên gia.".
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateChatAsync_ExpertNotFound_ThrowsKeyNotFound()
        {
            const int expertId = 999;
            const int userId = 2;
            SeedUser(userId, "user2@test.com");

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateChatAsync(expertId, userId));

            Assert.Equal("Không tìm thấy chuyên gia.", ex.Message);
        }

        /// <summary>
        /// UTCID04: expertId invalid (0, -1, int.MaxValue, int.MinValue) -> ném KeyNotFoundException.
        /// Đếm là 1 test trong báo cáo.
        /// </summary>
        [Fact]
        public async Task UTCID04_CreateChatAsync_InvalidExpertId_ThrowsKeyNotFound()
        {
            const int userId = 2;
            SeedUser(userId, "user2@test.com");

            var invalidExpertIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var expertId in invalidExpertIds)
            {
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.CreateChatAsync(expertId, userId));

                Assert.Equal("Không tìm thấy chuyên gia.", ex.Message);
            }
        }

        /// <summary>
        /// UTCID05: expertId == userId -> ném InvalidOperationException "Không thể tạo chat với chính mình.".
        /// </summary>
        [Fact]
        public async Task UTCID05_CreateChatAsync_ExpertIdEqualsUserId_ThrowsInvalidOperation()
        {
            const int id = 1;

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateChatAsync(id, id));

            Assert.Equal("Không thể tạo chat với chính mình.", ex.Message);
        }

        /// <summary>
        /// UTCID06: userId không tồn tại (999) trong khi expert tồn tại -> ném KeyNotFoundException "Không tìm thấy người dùng.".
        /// </summary>
        [Fact]
        public async Task UTCID06_CreateChatAsync_UserNotFound_ThrowsKeyNotFound()
        {
            const int expertId = 1;
            const int userId = 999;
            SeedUser(expertId, "expert1@test.com");

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateChatAsync(expertId, userId));

            Assert.Equal("Không tìm thấy người dùng.", ex.Message);
        }

        /// <summary>
        /// UTCID07: userId invalid (0, -1, int.MaxValue, int.MinValue) trong khi expert tồn tại -> ném KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID07_CreateChatAsync_InvalidUserId_ThrowsKeyNotFound()
        {
            const int expertId = 1;
            SeedUser(expertId, "expert1@test.com");

            var invalidUserIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var userId in invalidUserIds)
            {
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.CreateChatAsync(expertId, userId));

                Assert.Equal("Không tìm thấy người dùng.", ex.Message);
            }
        }
    }
}


