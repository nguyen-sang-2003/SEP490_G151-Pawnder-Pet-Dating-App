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
    public class CreateExpertConfirmationAsyncTest : IDisposable
    {
        private readonly Mock<IExpertConfirmationRepository> _mockExpertConfirmationRepo;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly PawnderDatabaseContext _context;
        private readonly PawnderDatabaseContext _limitContext;
        private readonly DailyLimitService _dailyLimitService;
        private readonly ExpertConfirmationService _service;

        public CreateExpertConfirmationAsyncTest()
        {
            _mockExpertConfirmationRepo = new Mock<IExpertConfirmationRepository>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"ExpertConfirmationCreateDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Create DailyLimitService with its own context
            var limitServiceOptions = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"DailyLimitDb_{Guid.NewGuid()}")
                .Options;
            _limitContext = new PawnderDatabaseContext(limitServiceOptions);
            _dailyLimitService = new DailyLimitService(_limitContext);

            _service = new ExpertConfirmationService(
                _mockExpertConfirmationRepo.Object,
                _context,
                _dailyLimitService,
                _mockNotificationService.Object,
                _mockHubContext.Object);

            // Setup default mocks
            SetupDefaultMocks();
        }

        private void SetupDefaultMocks()
        {
            // Setup repository AddAsync mock
            _mockExpertConfirmationRepo
                .Setup(r => r.AddAsync(It.IsAny<ExpertConfirmation>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ExpertConfirmation ec, CancellationToken _) => ec);

            // Setup GetExpertConfirmationByUserAndChatAsync to return null (no duplicate)
            _mockExpertConfirmationRepo
                .Setup(r => r.GetExpertConfirmationByUserAndChatAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ExpertConfirmation?)null);
        }

        public void Dispose()
        {
            _context.Dispose();
            _limitContext.Dispose();
        }

        private void SeedUser(int userId, string email, int roleId = 3)
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = email,
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

        private void SeedChatAi(int chatId, int userId)
        {
            if (!_context.ChatAis.Any(c => c.ChatAiid == chatId))
            {
                _context.ChatAis.Add(new ChatAi
                {
                    ChatAiid = chatId,
                    UserId = userId,
                    Title = "Test Chat",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                _context.SaveChanges();
            }
        }

        private void SeedDailyLimitUsage(int userId, string actionType, int count)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            if (!_limitContext.DailyLimits.Any(d => d.UserId == userId && d.ActionType == actionType && d.ActionDate == today))
            {
                _limitContext.DailyLimits.Add(new DailyLimit
                {
                    UserId = userId,
                    ActionType = actionType,
                    ActionDate = today,
                    Count = count,
                    CreatedAt = DateTime.Now
                });
                _limitContext.SaveChanges();
            }
        }

        /// <summary>
        /// UTCID01: userId=1 (valid), chatId=1 (valid), ExpertId=2 (valid, provided),
        /// All exists, CanPerformAction=TRUE, ConfirmationExists=FALSE
        /// -> Trả về ExpertConfirmationResponseDTO với các properties đúng.
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateExpertConfirmationAsync_ValidWithProvidedExpert_ReturnsSuccessDTO()
        {
            // Arrange
            const int userId = 1;
            const int chatId = 1;
            const int expertId = 2;

            SeedUser(userId, "user@test.com", 3); // Normal user
            SeedUser(expertId, "expert@test.com", 2); // Expert (RoleId = 2)
            SeedChatAi(chatId, userId);
            // DailyLimit uses in-memory dictionary with quota=2 for expert_confirm

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = expertId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act
            var result = await _service.CreateExpertConfirmationAsync(userId, chatId, dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(chatId, result.ChatAiId);
            Assert.Equal(expertId, result.ExpertId);
            Assert.Equal("pending", result.Status);
            Assert.Equal("Yêu cầu chuyên gia xác nhận đã được tạo thành công.", result.ResultMessage);
            Assert.NotNull(result.CreatedAt);
            Assert.NotNull(result.UpdatedAt);
        }

        /// <summary>
        /// UTCID02: userId=1 (valid), chatId=1 (valid), ExpertId=null (auto-assign),
        /// HasAvailableExperts=TRUE
        /// -> Trả về ExpertConfirmationResponseDTO với ExpertId được tự động gán.
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateExpertConfirmationAsync_AutoAssignExpert_ReturnsSuccessDTO()
        {
            // Arrange
            const int userId = 1;
            const int chatId = 1;
            const int expertId = 2;

            SeedUser(userId, "user@test.com", 3); // Normal user
            SeedUser(expertId, "expert@test.com", 2); // Expert available (RoleId = 2)
            SeedChatAi(chatId, userId);
            // DailyLimit uses in-memory dictionary with quota=2 for expert_confirm

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = null, // Auto-assign
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act
            var result = await _service.CreateExpertConfirmationAsync(userId, chatId, dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(chatId, result.ChatAiId);
            Assert.True(result.ExpertId > 0); // Auto-assigned
            Assert.Equal("pending", result.Status);
            Assert.Equal("Yêu cầu chuyên gia xác nhận đã được tạo thành công.", result.ResultMessage);
            Assert.NotNull(result.CreatedAt);
            Assert.NotNull(result.UpdatedAt);
        }

        /// <summary>
        /// UTCID03: ExpertId=999 (valid, not exists)
        /// -> Ném KeyNotFoundException với message "Chuyên gia không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateExpertConfirmationAsync_ExpertNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int userId = 1;
            const int chatId = 1;
            const int nonExistentExpertId = 999;

            SeedUser(userId, "user@test.com", 3);
            SeedChatAi(chatId, userId);
            // DailyLimit uses in-memory dictionary

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = nonExistentExpertId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateExpertConfirmationAsync(userId, chatId, dto));

            Assert.Equal("Chuyên gia không tồn tại.", ex.Message);
        }

        /// <summary>
        /// UTCID04: ExpertId=1 (valid, not Expert role - RoleId != 2)
        /// -> Ném KeyNotFoundException với message "Chuyên gia không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID04_CreateExpertConfirmationAsync_ExpertWrongRole_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int userId = 1;
            const int chatId = 1;
            const int notExpertUserId = 3;

            SeedUser(userId, "user@test.com", 3);
            SeedUser(notExpertUserId, "notexpert@test.com", 3); // Not Expert (RoleId = 3)
            SeedChatAi(chatId, userId);
            // DailyLimit uses in-memory dictionary

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = notExpertUserId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateExpertConfirmationAsync(userId, chatId, dto));

            Assert.Equal("Chuyên gia không tồn tại.", ex.Message);
        }

        /// <summary>
        /// UTCID05: userId=999 (valid, not exists), UserExists=FALSE
        /// -> Ném KeyNotFoundException với message "Người dùng không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID05_CreateExpertConfirmationAsync_UserNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int nonExistentUserId = 999;
            const int chatId = 1;
            const int expertId = 2;

            SeedUser(expertId, "expert@test.com", 2);
            SeedChatAi(chatId, 1);
            // DailyLimit uses in-memory dictionary

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = expertId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateExpertConfirmationAsync(nonExistentUserId, chatId, dto));

            Assert.Equal("Người dùng không tồn tại.", ex.Message);
        }

        /// <summary>
        /// UTCID06: chatId=999 (valid, not exists), ChatExists=FALSE
        /// -> Ném KeyNotFoundException với message "Chat AI không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID06_CreateExpertConfirmationAsync_ChatNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int userId = 1;
            const int nonExistentChatId = 999;
            const int expertId = 2;

            SeedUser(userId, "user@test.com", 3);
            SeedUser(expertId, "expert@test.com", 2);
            // DailyLimit uses in-memory dictionary
            // Chat not seeded

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = expertId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreateExpertConfirmationAsync(userId, nonExistentChatId, dto));

            Assert.Equal("Chat AI không tồn tại.", ex.Message);
        }

        /// <summary>
        /// UTCID07: HasAvailableExperts=FALSE (no experts in system)
        /// -> Ném InvalidOperationException với message chứa "không có chuyên gia nào khả dụng".
        /// </summary>
        [Fact]
        public async Task UTCID07_CreateExpertConfirmationAsync_NoAvailableExperts_ThrowsInvalidOperationException()
        {
            // Arrange
            const int userId = 1;
            const int chatId = 1;

            SeedUser(userId, "user@test.com", 3);
            SeedChatAi(chatId, userId);
            // DailyLimit uses in-memory dictionary
            // No experts seeded (no users with RoleId = 2)

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = null, // Auto-assign
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateExpertConfirmationAsync(userId, chatId, dto));

            Assert.Contains("không có chuyên gia nào khả dụng", ex.Message);
        }

        /// <summary>
        /// UTCID08: CanPerformAction=FALSE (daily limit exceeded)
        /// -> Ném InvalidOperationException với message chứa "hết lượt".
        /// </summary>
        [Fact]
        public async Task UTCID08_CreateExpertConfirmationAsync_DailyLimitExceeded_ThrowsInvalidOperationException()
        {
            // Arrange
            const int userId = 1;
            const int chatId = 1;
            const int expertId = 2;

            SeedUser(userId, "user@test.com", 3);
            SeedUser(expertId, "expert@test.com", 2);
            SeedChatAi(chatId, userId);
            // Seed usage that exceeds dict quota (quota=2 for expert_confirm)
            SeedDailyLimitUsage(userId, "expert_confirm", 100);

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = expertId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateExpertConfirmationAsync(userId, chatId, dto));

            Assert.Contains("hết lượt", ex.Message);
        }

        /// <summary>
        /// UTCID09: Invalid userId (0, -1, int.MaxValue, int.MinValue)
        /// -> Ném KeyNotFoundException với message "Người dùng không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID09_CreateExpertConfirmationAsync_InvalidUserId_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int chatId = 1;
            const int expertId = 2;

            SeedUser(expertId, "expert@test.com", 2);
            SeedChatAi(chatId, 1);
            // DailyLimit uses in-memory dictionary

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = expertId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            var invalidUserIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var userId in invalidUserIds)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.CreateExpertConfirmationAsync(userId, chatId, dto));

                Assert.Equal("Người dùng không tồn tại.", ex.Message);
            }
        }

        /// <summary>
        /// UTCID10: Invalid chatId (0, -1, int.MaxValue, int.MinValue)
        /// -> Ném KeyNotFoundException với message "Chat AI không tồn tại."
        /// </summary>
        [Fact]
        public async Task UTCID10_CreateExpertConfirmationAsync_InvalidChatId_ThrowsKeyNotFoundException()
        {
            // Arrange
            const int userId = 1;
            const int expertId = 2;

            SeedUser(userId, "user@test.com", 3);
            SeedUser(expertId, "expert@test.com", 2);
            // DailyLimit uses in-memory dictionary

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = expertId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            var invalidChatIds = new[] { 0, -1, int.MaxValue, int.MinValue };

            foreach (var chatId in invalidChatIds)
            {
                // Act & Assert
                var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                    () => _service.CreateExpertConfirmationAsync(userId, chatId, dto));

                Assert.Equal("Chat AI không tồn tại.", ex.Message);
            }
        }

        /// <summary>
        /// UTCID11: ConfirmationExists=TRUE (duplicate confirmation)
        /// -> Ném InvalidOperationException với message chứa "đã tồn tại".
        /// </summary>
        [Fact]
        public async Task UTCID11_CreateExpertConfirmationAsync_ConfirmationExists_ThrowsInvalidOperationException()
        {
            // Arrange
            const int userId = 1;
            const int chatId = 1;
            const int expertId = 2;

            SeedUser(userId, "user@test.com", 3);
            SeedUser(expertId, "expert@test.com", 2);
            SeedChatAi(chatId, userId);
            // DailyLimit uses in-memory dictionary

            // Setup mock to return existing confirmation
            var existingConfirmation = new ExpertConfirmation
            {
                UserId = userId,
                ChatAiid = chatId,
                ExpertId = expertId,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            _mockExpertConfirmationRepo
                .Setup(r => r.GetExpertConfirmationByUserAndChatAsync(userId, chatId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(existingConfirmation);

            var dto = new ExpertConfirmationCreateDTO
            {
                ExpertId = expertId,
                Message = "Test message",
                UserQuestion = "Test question"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateExpertConfirmationAsync(userId, chatId, dto));

            Assert.Contains("đã tồn tại", ex.Message);
        }
    }
}
