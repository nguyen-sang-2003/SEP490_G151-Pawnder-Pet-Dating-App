using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.BlockServiceTest
{
    public class CreateBlockAsyncTest : IDisposable
    {
        private readonly Mock<IBlockRepository> _mockBlockRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly BlockService _service;

        public CreateBlockAsyncTest()
        {
            _mockBlockRepository = new Mock<IBlockRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"CreateBlockDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new BlockService(_mockBlockRepository.Object, _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SeedUsers(params int[] userIds)
        {
            foreach (var id in userIds)
            {
                _context.Users.Add(new User
                {
                    UserId = id,
                    Email = $"user{id}@test.com",
                    PasswordHash = "hash",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            _context.SaveChanges();
        }

        /// <summary>
        /// UTCID01: valid from/to users, no existing block -> returns object with properties.
        /// </summary>
        [Fact]
        public async Task UTCID01_CreateBlockAsync_Valid_ReturnsBlockInfo()
        {
            // Arrange
            const int fromUserId = 1;
            const int toUserId = 2;
            SeedUsers(fromUserId, toUserId);

            _mockBlockRepository
                .Setup(r => r.GetBlockAsync(fromUserId, toUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Block?)null);
            _mockBlockRepository
                .Setup(r => r.AddAsync(It.IsAny<Block>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Block b, CancellationToken _) => b);

            // Act
            var result = await _service.CreateBlockAsync(fromUserId, toUserId);

            // Assert
            var type = result.GetType();
            Assert.Equal(fromUserId, type.GetProperty("FromUserId")?.GetValue(result));
            Assert.Equal(toUserId, type.GetProperty("ToUserId")?.GetValue(result));
            Assert.NotNull(type.GetProperty("CreatedAt")?.GetValue(result));
            _mockBlockRepository.Verify(r => r.AddAsync(It.Is<Block>(b => b.FromUserId == fromUserId && b.ToUserId == toUserId), It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID02: fromUserId not exists -> KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID02_CreateBlockAsync_FromUserNotExist_ThrowsKeyNotFound()
        {
            // Arrange
            const int fromUserId = 10;
            const int toUserId = 11;
            SeedUsers(toUserId); // only toUser exists

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CreateBlockAsync(fromUserId, toUserId));
            _mockBlockRepository.Verify(r => r.AddAsync(It.IsAny<Block>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID03: invalid fromUserId (0) -> KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID03_CreateBlockAsync_InvalidFromUserId_ThrowsKeyNotFound()
        {
            // Arrange
            const int fromUserId = 0;
            const int toUserId = 2;
            SeedUsers(toUserId);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CreateBlockAsync(fromUserId, toUserId));
            _mockBlockRepository.Verify(r => r.AddAsync(It.IsAny<Block>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID04: fromUserId equals toUserId -> InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID04_CreateBlockAsync_SelfBlock_ThrowsInvalidOperation()
        {
            const int userId = 5;
            SeedUsers(userId);

            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBlockAsync(userId, userId));
            _mockBlockRepository.Verify(r => r.AddAsync(It.IsAny<Block>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID05: toUserId not exists -> KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task UTCID05_CreateBlockAsync_ToUserNotExist_ThrowsKeyNotFound()
        {
            const int fromUserId = 1;
            const int toUserId = 99;
            SeedUsers(fromUserId);

            await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CreateBlockAsync(fromUserId, toUserId));
            _mockBlockRepository.Verify(r => r.AddAsync(It.IsAny<Block>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID06: block already exists -> InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID06_CreateBlockAsync_BlockAlreadyExists_ThrowsInvalidOperation()
        {
            const int fromUserId = 1;
            const int toUserId = 2;
            SeedUsers(fromUserId, toUserId);

            _mockBlockRepository
                .Setup(r => r.GetBlockAsync(fromUserId, toUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Block { FromUserId = fromUserId, ToUserId = toUserId });

            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateBlockAsync(fromUserId, toUserId));
            _mockBlockRepository.Verify(r => r.AddAsync(It.IsAny<Block>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }
}

