using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.BlockServiceTest
{
    public class GetBlockedUsersAsyncTest : IDisposable
    {
        private readonly Mock<IBlockRepository> _mockBlockRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly BlockService _service;

        public GetBlockedUsersAsyncTest()
        {
            _mockBlockRepository = new Mock<IBlockRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"BlockServiceDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new BlockService(_mockBlockRepository.Object, _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: fromUserId valid, blocked users exist -> returns list with properties.
        /// </summary>
        [Fact]
        public async Task UTCID01_GetBlockedUsersAsync_ValidWithData_ReturnsList()
        {
            // Arrange
            const int fromUserId = 1;
            var data = new List<object>
            {
                new { ToUserId = 2, ToUserFullName = "User Two", ToUserEmail = "two@example.com", CreatedAt = DateTime.UtcNow }
            };

            _mockBlockRepository
                .Setup(r => r.GetBlockedUsersAsync(fromUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(data);

            // Act
            var result = await _service.GetBlockedUsersAsync(fromUserId);

            // Assert
            var list = result.ToList();
            Assert.Single(list);
            var item = list[0];
            var type = item.GetType();
            Assert.NotNull(type.GetProperty("ToUserId")?.GetValue(item));
            Assert.NotNull(type.GetProperty("ToUserFullName")?.GetValue(item));
            Assert.NotNull(type.GetProperty("ToUserEmail")?.GetValue(item));
            Assert.NotNull(type.GetProperty("CreatedAt")?.GetValue(item));
        }

        /// <summary>
        /// UTCID02: fromUserId invalid (0) -> returns empty list (repository mocked accordingly).
        /// </summary>
        [Fact]
        public async Task UTCID02_GetBlockedUsersAsync_InvalidId_ReturnsEmpty()
        {
            const int invalidId = 0;
            _mockBlockRepository
                .Setup(r => r.GetBlockedUsersAsync(invalidId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<object>());

            var result = await _service.GetBlockedUsersAsync(invalidId);

            Assert.Empty(result);
        }

        /// <summary>
        /// UTCID03: fromUserId not found -> returns empty list.
        /// </summary>
        [Fact]
        public async Task UTCID03_GetBlockedUsersAsync_UserNotFound_ReturnsEmpty()
        {
            const int missingId = 999;
            _mockBlockRepository
                .Setup(r => r.GetBlockedUsersAsync(missingId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<object>());

            var result = await _service.GetBlockedUsersAsync(missingId);

            Assert.Empty(result);
        }
    }
}

