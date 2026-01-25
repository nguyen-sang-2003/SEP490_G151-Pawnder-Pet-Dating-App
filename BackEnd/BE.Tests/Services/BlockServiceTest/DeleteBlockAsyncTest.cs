using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BE.Tests.Services.BlockServiceTest
{
    public class DeleteBlockAsyncTest : IDisposable
    {
        private readonly Mock<IBlockRepository> _mockBlockRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly BlockService _service;

        public DeleteBlockAsyncTest()
        {
            _mockBlockRepository = new Mock<IBlockRepository>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"DeleteBlockDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);
            _service = new BlockService(_mockBlockRepository.Object, _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: Block exists with valid from/to -> returns true.
        /// </summary>
        [Fact]
        public async Task UTCID01_DeleteBlockAsync_BlockExists_ReturnsTrue()
        {
            const int fromUserId = 1;
            const int toUserId = 2;
            var block = new Block { FromUserId = fromUserId, ToUserId = toUserId };

            _mockBlockRepository
                .Setup(r => r.GetBlockAsync(fromUserId, toUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(block);

            _mockBlockRepository
                .Setup(r => r.DeleteAsync(block, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var result = await _service.DeleteBlockAsync(fromUserId, toUserId);

            Assert.True(result);
            _mockBlockRepository.Verify(r => r.DeleteAsync(block, It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// UTCID02: Block not found -> returns false.
        /// </summary>
        [Fact]
        public async Task UTCID02_DeleteBlockAsync_BlockNotFound_ReturnsFalse()
        {
            const int fromUserId = 1;
            const int toUserId = 2;

            _mockBlockRepository
                .Setup(r => r.GetBlockAsync(fromUserId, toUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Block?)null);

            var result = await _service.DeleteBlockAsync(fromUserId, toUserId);

            Assert.False(result);
            _mockBlockRepository.Verify(r => r.DeleteAsync(It.IsAny<Block>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        /// <summary>
        /// UTCID03: invalid fromUserId (0) -> returns false (repository returns null).
        /// </summary>
        [Fact]
        public async Task UTCID03_DeleteBlockAsync_InvalidFromUserId_ReturnsFalse()
        {
            const int fromUserId = 0;
            const int toUserId = 2;

            _mockBlockRepository
                .Setup(r => r.GetBlockAsync(fromUserId, toUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Block?)null);

            var result = await _service.DeleteBlockAsync(fromUserId, toUserId);

            Assert.False(result);
        }

        /// <summary>
        /// UTCID04: invalid toUserId (-1) -> returns false (repository returns null).
        /// </summary>
        [Fact]
        public async Task UTCID04_DeleteBlockAsync_InvalidToUserId_ReturnsFalse()
        {
            const int fromUserId = 1;
            const int toUserId = -1;

            _mockBlockRepository
                .Setup(r => r.GetBlockAsync(fromUserId, toUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Block?)null);

            var result = await _service.DeleteBlockAsync(fromUserId, toUserId);

            Assert.False(result);
        }
    }
}

