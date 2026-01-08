using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.Services.PaymentHistoryServiceTest
{
    public class CreatePaymentHistoryAsyncTest : IDisposable
    {
        private readonly Mock<IPaymentHistoryRepository> _mockPaymentHistoryRepo;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly PawnderDatabaseContext _context;
        private readonly PaymentHistoryService _service;

        public CreatePaymentHistoryAsyncTest()
        {
            _mockPaymentHistoryRepo = new Mock<IPaymentHistoryRepository>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockConfiguration = new Mock<IConfiguration>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PaymentHistoryCreateDb_{Guid.NewGuid()}")
                .Options;

            _context = new PawnderDatabaseContext(options);

            _service = new PaymentHistoryService(
                _mockPaymentHistoryRepo.Object,
                _context,
                _mockHttpClientFactory.Object,
                _mockConfiguration.Object);

            // Setup SePay config for all tests
            SetupSepayConfig();
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SetupSepayConfig()
        {
            _mockConfiguration.Setup(c => c["Sepay:ApiKey"]).Returns("valid-api-key");
            _mockConfiguration.Setup(c => c["Sepay:ApiUrl"]).Returns("https://api.sepay.vn/transactions");
            _mockConfiguration.Setup(c => c["Sepay:AccountNumber"]).Returns("123456789");
            _mockConfiguration.Setup(c => c["Sepay:Limit"]).Returns("100");
        }

        private void SeedUser(int userId, string email)
        {
            if (!_context.Users.Any(u => u.UserId == userId))
            {
                _context.Users.Add(new User
                {
                    UserId = userId,
                    Email = email,
                    FullName = "Test User",
                    PasswordHash = "hash",
                    UserStatusId = 2,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                });
                _context.SaveChanges();
            }
        }

        private Mock<HttpMessageHandler> CreateMockHttpHandler(HttpResponseMessage response)
        {
            var mockHandler = new Mock<HttpMessageHandler>();
            mockHandler.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(response);
            return mockHandler;
        }

        private void SetupHttpClientWithMatchingTransaction(int userId, decimal amount, int durationMonths)
        {
            var transactionDate = DateTime.Now.AddMinutes(-5).ToString("yyyy-MM-dd HH:mm:ss");
            var responseJson = JsonSerializer.Serialize(new
            {
                status = 200,
                transactions = new[]
                {
                    new
                    {
                        id = "trans123",
                        amount_in = amount,
                        transaction_content = $"userId{userId}months{durationMonths}",
                        transaction_date = transactionDate
                    }
                }
            });

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
            };

            var mockHandler = CreateMockHttpHandler(response);
            var httpClient = new HttpClient(mockHandler.Object);
            _mockHttpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);
        }

        private void SetupHttpClientWithNoTransaction()
        {
            var responseJson = JsonSerializer.Serialize(new
            {
                status = 200,
                transactions = Array.Empty<object>()
            });

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
            };

            var mockHandler = CreateMockHttpHandler(response);
            var httpClient = new HttpClient(mockHandler.Object);
            _mockHttpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);
        }

        /// <summary>
        /// UTCID01: UserId=1 (exists), DurationMonths=1, Amount=50000, Basic Plan
        /// -> Returns success object.
        /// </summary>
        [Fact]
        public async Task UTCID01_CreatePaymentHistoryAsync_ValidBasicPlan_ReturnsSuccess()
        {
            // Arrange
            SeedUser(1, "user1@test.com");
            SetupHttpClientWithMatchingTransaction(1, 50000, 1);

            _mockPaymentHistoryRepo
                .Setup(r => r.AddAsync(It.IsAny<PaymentHistory>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((PaymentHistory p, CancellationToken _) => p);

            var request = new CreatePaymentHistoryRequest
            {
                UserId = 1,
                DurationMonths = 1,
                Amount = 50000
            };

            // Act
            var result = await _service.CreatePaymentHistoryAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var success = type.GetProperty("success")?.GetValue(result) as bool?;
            Assert.True(success);
        }

        /// <summary>
        /// UTCID02: UserId=999 (not exists)
        /// -> Throws KeyNotFoundException "User không tồn tại".
        /// </summary>
        [Fact]
        public async Task UTCID02_CreatePaymentHistoryAsync_UserNotExists_ThrowsKeyNotFoundException()
        {
            // Arrange - don't seed user 999
            var request = new CreatePaymentHistoryRequest
            {
                UserId = 999,
                DurationMonths = 1,
                Amount = 50000
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _service.CreatePaymentHistoryAsync(request));

            Assert.Contains("User không tồn tại", ex.Message);
        }

        /// <summary>
        /// UTCID03: UserId=2 (exists), Premium Plan
        /// -> Returns success object.
        /// </summary>
        [Fact]
        public async Task UTCID03_CreatePaymentHistoryAsync_ValidPremiumPlan_ReturnsSuccess()
        {
            // Arrange
            SeedUser(2, "user2@test.com");
            SetupHttpClientWithMatchingTransaction(2, 100000, 3);

            _mockPaymentHistoryRepo
                .Setup(r => r.AddAsync(It.IsAny<PaymentHistory>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((PaymentHistory p, CancellationToken _) => p);

            var request = new CreatePaymentHistoryRequest
            {
                UserId = 2,
                DurationMonths = 3,
                Amount = 100000
            };

            // Act
            var result = await _service.CreatePaymentHistoryAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var success = type.GetProperty("success")?.GetValue(result) as bool?;
            Assert.True(success);
        }

        /// <summary>
        /// UTCID04: Annual Plan with DurationMonths=12
        /// -> Returns success object.
        /// </summary>
        [Fact]
        public async Task UTCID04_CreatePaymentHistoryAsync_ValidAnnualPlan_ReturnsSuccess()
        {
            // Arrange
            SeedUser(1, "user1@test.com");
            SetupHttpClientWithMatchingTransaction(1, 500000, 12);

            _mockPaymentHistoryRepo
                .Setup(r => r.AddAsync(It.IsAny<PaymentHistory>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((PaymentHistory p, CancellationToken _) => p);

            var request = new CreatePaymentHistoryRequest
            {
                UserId = 1,
                DurationMonths = 12,
                Amount = 500000
            };

            // Act
            var result = await _service.CreatePaymentHistoryAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var success = type.GetProperty("success")?.GetValue(result) as bool?;
            Assert.True(success);
        }

        /// <summary>
        /// UTCID05: No matching payment found (payment not made yet)
        /// -> Returns object with paid=false.
        /// </summary>
        [Fact]
        public async Task UTCID05_CreatePaymentHistoryAsync_NoPaymentFound_ReturnsPaidFalse()
        {
            // Arrange
            SeedUser(1, "user1@test.com");
            SetupHttpClientWithNoTransaction();

            var request = new CreatePaymentHistoryRequest
            {
                UserId = 1,
                DurationMonths = 1,
                Amount = 50000
            };

            // Act
            var result = await _service.CreatePaymentHistoryAsync(request);

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var paid = type.GetProperty("paid")?.GetValue(result) as bool?;
            var success = type.GetProperty("success")?.GetValue(result) as bool?;
            Assert.False(paid);
            Assert.False(success);
        }

        /// <summary>
        /// UTCID06: User already has active VIP
        /// -> Throws InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID06_CreatePaymentHistoryAsync_UserHasActiveVip_ThrowsInvalidOperationException()
        {
            // Arrange
            SeedUser(1, "user1@test.com");

            // Seed active VIP
            _context.PaymentHistories.Add(new PaymentHistory
            {
                UserId = 1,
                StatusService = "active",
                StartDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-10)),
                EndDate = DateOnly.FromDateTime(DateTime.Today.AddDays(20)), // Active VIP
                Amount = 50000,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            });
            await _context.SaveChangesAsync();

            var request = new CreatePaymentHistoryRequest
            {
                UserId = 1,
                DurationMonths = 1,
                Amount = 50000
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreatePaymentHistoryAsync(request));

            Assert.Contains("VIP", ex.Message);
        }
    }
}
