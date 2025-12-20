using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BE.Tests.Services.PaymentHistoryServiceTest
{
    public class GetPaymentHistoriesByUserIdAsyncTest : IDisposable
    {
        private readonly Mock<IPaymentHistoryRepository> _mockPaymentHistoryRepo;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly PawnderDatabaseContext _context;
        private readonly PaymentHistoryService _service;

        public GetPaymentHistoriesByUserIdAsyncTest()
        {
            _mockPaymentHistoryRepo = new Mock<IPaymentHistoryRepository>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockConfiguration = new Mock<IConfiguration>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PaymentHistoryGetDb_{Guid.NewGuid()}")
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
        /// UTCID01: UserId = 1 (multiple histories)
        /// Repository returns multiple items (3) with all data fields present
        /// Expected: Returns IEnumerable<object> with 3 items
        /// </summary>
        [Fact]
        public async Task UTCID01_GetPaymentHistoriesByUserIdAsync_MultipleHistories_ReturnsMultipleItems()
        {
            // Arrange
            int userId = 1;
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
                    startDate = today.AddMonths(-1),
                    endDate = today.AddMonths(1),
                    createdAt = now.AddDays(-30),
                    updatedAt = now.AddDays(-30)
                },
                new
                {
                    historyId = 2,
                    userId = 1,
                    statusService = "expired",
                    startDate = today.AddMonths(-3),
                    endDate = today.AddMonths(-1),
                    createdAt = now.AddDays(-90),
                    updatedAt = now.AddDays(-30)
                },
                new
                {
                    historyId = 3,
                    userId = 1,
                    statusService = "pending",
                    startDate = today,
                    endDate = today.AddMonths(1),
                    createdAt = now,
                    updatedAt = now
                }
            };

            _mockPaymentHistoryRepo
                .Setup(r => r.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Equal(3, resultList.Count);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID02: UserId = 3 (no history, but repo returns single item)
        /// Repository returns single item (1) with all data fields present
        /// Expected: Returns IEnumerable<object> with 1 item
        /// </summary>
        [Fact]
        public async Task UTCID02_GetPaymentHistoriesByUserIdAsync_SingleHistory_ReturnsSingleItem()
        {
            // Arrange
            int userId = 3;
            var cancellationToken = default(CancellationToken);
            var now = DateTime.Now;
            var today = DateOnly.FromDateTime(now);

            var expectedHistories = new List<object>
            {
                new
                {
                    historyId = 1,
                    userId = 3,
                    statusService = "active",
                    startDate = today.AddMonths(-1),
                    endDate = today.AddMonths(1),
                    createdAt = now.AddDays(-30),
                    updatedAt = now.AddDays(-30)
                }
            };

            _mockPaymentHistoryRepo
                .Setup(r => r.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Single(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID03: UserId = 0 (boundary zero)
        /// Repository returns empty list (0)
        /// Expected: Returns IEnumerable<object> (empty list)
        /// </summary>
        [Fact]
        public async Task UTCID03_GetPaymentHistoriesByUserIdAsync_BoundaryZeroUserId_ReturnsEmptyList()
        {
            // Arrange
            int userId = 0;
            var cancellationToken = default(CancellationToken);
            var expectedHistories = new List<object>();

            _mockPaymentHistoryRepo
                .Setup(r => r.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID04: UserId = -1 (boundary negative)
        /// Repository returns empty list (0)
        /// Expected: Returns IEnumerable<object> (empty list)
        /// </summary>
        [Fact]
        public async Task UTCID04_GetPaymentHistoriesByUserIdAsync_BoundaryNegativeUserId_ReturnsEmptyList()
        {
            // Arrange
            int userId = -1;
            var cancellationToken = default(CancellationToken);
            var expectedHistories = new List<object>();

            _mockPaymentHistoryRepo
                .Setup(r => r.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID05: UserId = 4 (exception case)
        /// Repository returns empty list (0)
        /// Expected: Returns IEnumerable<object> (empty list)
        /// </summary>
        [Fact]
        public async Task UTCID05_GetPaymentHistoriesByUserIdAsync_ExceptionCaseNoData_ReturnsEmptyList()
        {
            // Arrange
            int userId = 4;
            var cancellationToken = default(CancellationToken);
            var expectedHistories = new List<object>();

            _mockPaymentHistoryRepo
                .Setup(r => r.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken))
                .ReturnsAsync(expectedHistories);

            // Act
            var result = await _service.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultList = result.ToList();
            Assert.Empty(resultList);
            Assert.IsAssignableFrom<IEnumerable<object>>(result);
        }

        /// <summary>
        /// UTCID06: UserId = 4 (exception case)
        /// Repository throws InvalidOperationException "Database connection failed"
        /// Expected: Throws InvalidOperationException with message "Database connection failed"
        /// </summary>
        [Fact]
        public async Task UTCID06_GetPaymentHistoriesByUserIdAsync_DatabaseConnectionFailed_ThrowsInvalidOperationException()
        {
            // Arrange
            int userId = 4;
            var cancellationToken = default(CancellationToken);

            _mockPaymentHistoryRepo
                .Setup(r => r.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken))
                .ThrowsAsync(new InvalidOperationException("Database connection failed"));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.GetPaymentHistoriesByUserIdAsync(userId, cancellationToken));

            Assert.Equal("Database connection failed", exception.Message);
        }
    }
}
