using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BE.Tests.Services.PaymentHistoryServiceTest
{
    public class GetVipStatusAsyncTest : IDisposable
    {
        private readonly Mock<IPaymentHistoryRepository> _mockPaymentHistoryRepo;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly PawnderDatabaseContext _context;
        private readonly PaymentHistoryService _service;

        public GetVipStatusAsyncTest()
        {
            _mockPaymentHistoryRepo = new Mock<IPaymentHistoryRepository>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockConfiguration = new Mock<IConfiguration>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PaymentHistoryVipStatusDb_{Guid.NewGuid()}")
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
        /// UTCID01: UserId = 1 (active subscription)
        /// Repository returns active subscription object with all data fields present
        /// Expected: Returns object with success=true, isVip=true, subscription=activeSubscription
        /// </summary>
        [Fact]
        public async Task UTCID01_GetVipStatusAsync_ActiveSubscription_ReturnsVipTrue()
        {
            // Arrange
            int userId = 1;
            var cancellationToken = default(CancellationToken);
            var today = DateOnly.FromDateTime(DateTime.Now);

            var activeSubscription = new
            {
                historyId = 1,
                statusService = "active",
                startDate = today.AddMonths(-1),
                endDate = today.AddMonths(1),
                daysRemaining = 30
            };

            _mockPaymentHistoryRepo
                .Setup(r => r.GetVipStatusAsync(userId, cancellationToken))
                .ReturnsAsync(activeSubscription);

            // Act
            var result = await _service.GetVipStatusAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var success = resultType.GetProperty("success")?.GetValue(result) as bool?;
            var isVip = resultType.GetProperty("isVip")?.GetValue(result) as bool?;
            var subscription = resultType.GetProperty("subscription")?.GetValue(result);

            Assert.True(success);
            Assert.True(isVip);
            Assert.NotNull(subscription);
        }

        /// <summary>
        /// UTCID02: UserId = 2 (no subscription)
        /// Repository returns null (no subscription)
        /// Expected: Returns object with success=true, isVip=false, subscription=null
        /// </summary>
        [Fact]
        public async Task UTCID02_GetVipStatusAsync_NoSubscription_ReturnsVipFalse()
        {
            // Arrange
            int userId = 2;
            var cancellationToken = default(CancellationToken);

            _mockPaymentHistoryRepo
                .Setup(r => r.GetVipStatusAsync(userId, cancellationToken))
                .ReturnsAsync((object?)null);

            // Act
            var result = await _service.GetVipStatusAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var success = resultType.GetProperty("success")?.GetValue(result) as bool?;
            var isVip = resultType.GetProperty("isVip")?.GetValue(result) as bool?;
            var subscription = resultType.GetProperty("subscription")?.GetValue(result);

            Assert.True(success);
            Assert.False(isVip);
            Assert.Null(subscription);
        }

        /// <summary>
        /// UTCID03: UserId = 3 (expired subscription)
        /// Repository returns null (expired subscription not considered active)
        /// Expected: Returns object with success=true, isVip=false, subscription=null
        /// </summary>
        [Fact]
        public async Task UTCID03_GetVipStatusAsync_ExpiredSubscription_ReturnsVipFalse()
        {
            // Arrange
            int userId = 3;
            var cancellationToken = default(CancellationToken);

            // Repository returns null for expired subscriptions
            _mockPaymentHistoryRepo
                .Setup(r => r.GetVipStatusAsync(userId, cancellationToken))
                .ReturnsAsync((object?)null);

            // Act
            var result = await _service.GetVipStatusAsync(userId, cancellationToken);

            // Assert
            Assert.NotNull(result);
            var resultType = result.GetType();
            
            var success = resultType.GetProperty("success")?.GetValue(result) as bool?;
            var isVip = resultType.GetProperty("isVip")?.GetValue(result) as bool?;
            var subscription = resultType.GetProperty("subscription")?.GetValue(result);

            Assert.True(success);
            Assert.False(isVip);
            Assert.Null(subscription);
        }

        /// <summary>
        /// UTCID04: Exception case
        /// Repository throws InvalidOperationException "Database connection failed"
        /// Expected: Throws InvalidOperationException with message "Database connection failed"
        /// </summary>
        [Fact]
        public async Task UTCID04_GetVipStatusAsync_DatabaseConnectionFailed_ThrowsInvalidOperationException()
        {
            // Arrange
            int userId = 4;
            var cancellationToken = default(CancellationToken);

            _mockPaymentHistoryRepo
                .Setup(r => r.GetVipStatusAsync(userId, cancellationToken))
                .ThrowsAsync(new InvalidOperationException("Database connection failed"));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.GetVipStatusAsync(userId, cancellationToken));

            Assert.Equal("Database connection failed", exception.Message);
        }
    }
}
