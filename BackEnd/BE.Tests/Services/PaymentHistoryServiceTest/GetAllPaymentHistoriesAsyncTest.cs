using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BE.Tests.Services.PaymentHistoryServiceTest
{
    public class GetAllPaymentHistoriesAsyncTest : IDisposable
    {
        private readonly Mock<IPaymentHistoryRepository> _mockPaymentHistoryRepo;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly PawnderDatabaseContext _context;
        private readonly PaymentHistoryService _service;

        public GetAllPaymentHistoriesAsyncTest()
        {
            _mockPaymentHistoryRepo = new Mock<IPaymentHistoryRepository>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockConfiguration = new Mock<IConfiguration>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PaymentHistoryGetAllDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            _service = new PaymentHistoryService(
                _mockPaymentHistoryRepo.Object,
                _context,
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        /// <summary>
        /// UTCID01: Multiple items with "active" status, valid amounts and dates
        /// Repository returns multiple items with all data present
        /// Expected: Returns IEnumerable<object> with multiple items
        /// </summary>
        [Fact]
        public async Task UTCID01_GetAllPaymentHistoriesAsync_MultipleActiveItems_ReturnsMultipleItems()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);
            var now = DateTime.Now;
            var today = DateOnly.FromDateTime(now);

            var expectedHistories = new List<object>
            {
                new
                {
                    historyId = 1,
                    userId = 1,
                    statusService = "active",
                    amount = 50000m,
                    startDate = today.AddMonths(-1),
                    endDate = today.AddMonths(1),
                    createdAt = now.AddDays(-30),
                    updatedAt = now.AddDays(-30)
                },
                new
                {
                    historyId = 2,
                    userId = 2,
                    statusService = "active",
                    amount = 100000m,
                    startDate = today.AddMonths(-2),
                    endDate = today.AddMonths(1),
                    createdAt = now.AddDays(-60),
                    updatedAt = now.AddDays(-60)
                },
                new
                {
                    historyId = 3,
                    userId = 3,
                    statusService = "active",
                    amount = 500000m,
                    startDate = today.AddMonths(-6),
                    endDate = today.AddMonths(6),
                    createdAt = now.AddDays(-180),
                    updatedAt = now.AddDays(-180)
                }
            };

            _mockPaymentHistoryRepo
                .Setup(r => r.GetAllPaymentHistoriesAsync(cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetAllPaymentHistoriesAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(3, resultList.Count);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID02: Empty list
        /// Repository returns empty list
        /// Expected: Returns IEnumerable<object> (empty list)
        /// </summary>
        [Fact]
        public async Task UTCID02_GetAllPaymentHistoriesAsync_EmptyList_ReturnsEmptyList()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);
            var expectedHistories = new List<object>();

            _mockPaymentHistoryRepo
                .Setup(r => r.GetAllPaymentHistoriesAsync(cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetAllPaymentHistoriesAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID03: Single item with "active" status, valid amounts and dates
        /// Repository returns single item with all data present
        /// Expected: Returns IEnumerable<object> with 1 item
        /// </summary>
        [Fact]
        public async Task UTCID03_GetAllPaymentHistoriesAsync_SingleActiveItem_ReturnsSingleItem()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);
            var now = DateTime.Now;
            var today = DateOnly.FromDateTime(now);

            var expectedHistories = new List<object>
            {
                new
                {
                    historyId = 1,
                    userId = 1,
                    statusService = "active",
                    amount = 50000m,
                    startDate = today.AddMonths(-1),
                    endDate = today.AddMonths(1),
                    createdAt = now.AddDays(-30),
                    updatedAt = now.AddDays(-30)
                }
            };

            _mockPaymentHistoryRepo
                .Setup(r => r.GetAllPaymentHistoriesAsync(cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetAllPaymentHistoriesAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID04: Multiple items, cancelled CancellationToken
        /// Repository throws OperationCanceledException
        /// Expected: Throws OperationCanceledException
        /// </summary>
        [Fact]
        public async Task UTCID04_GetAllPaymentHistoriesAsync_CancelledToken_ThrowsOperationCanceledException()
        {
            // Arrange
            var cancellationTokenSource = new CancellationTokenSource();
            cancellationTokenSource.Cancel();
            var cancellationToken = cancellationTokenSource.Token;

            _mockPaymentHistoryRepo
                .Setup(r => r.GetAllPaymentHistoriesAsync(It.IsAny<CancellationToken>()))
                .ThrowsAsync(new OperationCanceledException("Database connection failed"));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<OperationCanceledException>(
                () => _service.GetAllPaymentHistoriesAsync(cancellationToken));

            Assert.Equal("Database connection failed", exception.Message);
        }

        /// <summary>
        /// UTCID05: Multiple items with some missing user data
        /// Repository returns items with partial data
        /// Expected: Returns IEnumerable<object> with multiple items
        /// </summary>
        [Fact]
        public async Task UTCID05_GetAllPaymentHistoriesAsync_SomeMissingData_ReturnsMultipleItems()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);
            var now = DateTime.Now;
            var today = DateOnly.FromDateTime(now);

            var expectedHistories = new List<object>
            {
                new
                {
                    historyId = 1,
                    userId = 1,
                    statusService = "active",
                    amount = 50000m,
                    startDate = today.AddMonths(-1),
                    endDate = today.AddMonths(1),
                    createdAt = now.AddDays(-30),
                    updatedAt = now.AddDays(-30)
                },
                new
                {
                    historyId = 2,
                    userId = 999, // User may not exist
                    statusService = "active",
                    amount = 100000m,
                    startDate = today.AddMonths(-2),
                    endDate = today.AddMonths(1),
                    createdAt = now.AddDays(-60),
                    updatedAt = now.AddDays(-60)
                }
            };

            _mockPaymentHistoryRepo
                .Setup(r => r.GetAllPaymentHistoriesAsync(cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetAllPaymentHistoriesAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID06: Multiple items with "pending" status
        /// Repository returns items with pending status
        /// Expected: Returns IEnumerable<object> with multiple items
        /// </summary>
        [Fact]
        public async Task UTCID06_GetAllPaymentHistoriesAsync_PendingStatus_ReturnsMultipleItems()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);
            var now = DateTime.Now;
            var today = DateOnly.FromDateTime(now);

            var expectedHistories = new List<object>
            {
                new
                {
                    historyId = 1,
                    userId = 1,
                    statusService = "pending",
                    amount = 50000m,
                    startDate = today,
                    endDate = today.AddMonths(1),
                    createdAt = now,
                    updatedAt = now
                },
                new
                {
                    historyId = 2,
                    userId = 2,
                    statusService = "pending",
                    amount = 100000m,
                    startDate = today,
                    endDate = today.AddMonths(3),
                    createdAt = now,
                    updatedAt = now
                }
            };

            _mockPaymentHistoryRepo
                .Setup(r => r.GetAllPaymentHistoriesAsync(cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetAllPaymentHistoriesAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(2, resultList.Count);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID07: Multiple items with mixed "active" and "expired" status
        /// Repository returns items with mixed statuses
        /// Expected: Returns IEnumerable<object> with multiple items
        /// </summary>
        [Fact]
        public async Task UTCID07_GetAllPaymentHistoriesAsync_MixedActiveExpiredStatus_ReturnsMultipleItems()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);
            var now = DateTime.Now;
            var today = DateOnly.FromDateTime(now);

            var expectedHistories = new List<object>
            {
                new
                {
                    historyId = 1,
                    userId = 1,
                    statusService = "active",
                    amount = 50000m,
                    startDate = today.AddMonths(-1),
                    endDate = today.AddMonths(1),
                    createdAt = now.AddDays(-30),
                    updatedAt = now.AddDays(-30)
                },
                new
                {
                    historyId = 2,
                    userId = 2,
                    statusService = "expired",
                    amount = 100000m,
                    startDate = today.AddMonths(-6),
                    endDate = today.AddMonths(-1),
                    createdAt = now.AddDays(-180),
                    updatedAt = now.AddDays(-30)
                },
                new
                {
                    historyId = 3,
                    userId = 3,
                    statusService = "active",
                    amount = 500000m,
                    startDate = today.AddMonths(-3),
                    endDate = today.AddMonths(9),
                    createdAt = now.AddDays(-90),
                    updatedAt = now.AddDays(-90)
                }
            };

            _mockPaymentHistoryRepo
                .Setup(r => r.GetAllPaymentHistoriesAsync(cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetAllPaymentHistoriesAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(3, resultList.Count);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID08: More than 100 items with null status, amount, and dates
        /// Repository returns large dataset with missing/null fields
        /// Expected: Returns IEnumerable<object> with >100 items
        /// </summary>
        [Fact]
        public async Task UTCID08_GetAllPaymentHistoriesAsync_MoreThan100ItemsWithNullData_ReturnsLargeDataset()
        {
            // Arrange
            var cancellationToken = default(CancellationToken);
            var now = DateTime.Now;

            var expectedHistories = new List<object>();
            for (int i = 1; i <= 105; i++)
            {
                expectedHistories.Add(new
                {
                    historyId = i,
                    userId = i,
                    statusService = (string?)null,
                    amount = (decimal?)null,
                    startDate = (DateOnly?)null,
                    endDate = (DateOnly?)null,
                    createdAt = now,
                    updatedAt = now
                });
            }

            _mockPaymentHistoryRepo
                .Setup(r => r.GetAllPaymentHistoriesAsync(cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetAllPaymentHistoriesAsync(cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.True(resultList.Count > 100);
            Assert.Equal(105, resultList.Count);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }
    }
}
