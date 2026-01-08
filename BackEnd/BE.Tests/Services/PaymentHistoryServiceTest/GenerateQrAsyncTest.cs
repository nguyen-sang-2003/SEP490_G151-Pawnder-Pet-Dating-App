using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
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
    public class GenerateQrAsyncTest : IDisposable
    {
        private readonly Mock<IPaymentHistoryRepository> _mockPaymentHistoryRepo;
        private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly PawnderDatabaseContext _context;
        private readonly PaymentHistoryService _service;

        public GenerateQrAsyncTest()
        {
            _mockPaymentHistoryRepo = new Mock<IPaymentHistoryRepository>();
            _mockHttpClientFactory = new Mock<IHttpClientFactory>();
            _mockConfiguration = new Mock<IConfiguration>();

            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase($"PaymentHistoryGenerateQrDb_{Guid.NewGuid()}")
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

        private void SetupVietQrConfig()
        {
            _mockConfiguration.Setup(c => c["VietQr:ApiKey"]).Returns("valid-api-key");
            _mockConfiguration.Setup(c => c["VietQr:ClientId"]).Returns("valid-client-id");
            _mockConfiguration.Setup(c => c["VietQr:AccountInfo:AccountNo"]).Returns("123456789");
            _mockConfiguration.Setup(c => c["VietQr:AccountInfo:AccountName"]).Returns("Test Account");
            _mockConfiguration.Setup(c => c["VietQr:AccountInfo:AcqId"]).Returns("970415");
            _mockConfiguration.Setup(c => c["VietQr:AccountInfo:Template"]).Returns("compact");
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

        private void SetupHttpClient(HttpResponseMessage response)
        {
            var mockHandler = CreateMockHttpHandler(response);
            var httpClient = new HttpClient(mockHandler.Object);
            _mockHttpClientFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);
        }

        /// <summary>
        /// UTCID01: Valid amount, valid addInfo, success code "00", contains qrDataURL
        /// -> Returns byte[] (QR image bytes).
        /// </summary>
        [Fact]
        public async Task UTCID01_GenerateQrAsync_ValidInput_ReturnsQrBytes()
        {
            // Arrange
            SetupVietQrConfig();

            // Use base64 encoded simple image data
            var base64Image = Convert.ToBase64String(Encoding.UTF8.GetBytes("fake-image-data"));
            var responseJson = JsonSerializer.Serialize(new
            {
                code = "00",
                data = new { qrDataURL = $"data:image/png;base64,{base64Image}" }
            });

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
            };
            SetupHttpClient(response);

            // Act
            var result = await _service.GenerateQrAsync(50000, "userId1months1");

            // Assert
            Assert.NotNull(result);
            Assert.IsType<byte[]>(result);
            Assert.True(result.Length > 0);
        }

        /// <summary>
        /// UTCID02: User has active VIP
        /// -> Throws InvalidOperationException with message about VIP subscription.
        /// </summary>
        [Fact]
        public async Task UTCID02_GenerateQrAsync_UserHasActiveVip_ThrowsInvalidOperationException()
        {
            // Arrange
            SetupVietQrConfig();

            // Seed user with active VIP
            var user = new User
            {
                UserId = 1,
                Email = "test@example.com",
                FullName = "Test User",
                PasswordHash = "hash",
                UserStatusId = 3,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Users.Add(user);

            var paymentHistory = new PaymentHistory
            {
                UserId = 1,
                StatusService = "active",
                StartDate = DateOnly.FromDateTime(DateTime.Today.AddDays(-10)),
                EndDate = DateOnly.FromDateTime(DateTime.Today.AddDays(20)), // Active VIP
                Amount = 50000,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.PaymentHistories.Add(paymentHistory);
            await _context.SaveChangesAsync();

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.GenerateQrAsync(50000, "userId1months1"));

            Assert.Contains("gói đăng ký VIP", ex.Message);
        }

        /// <summary>
        /// UTCID03: VietQR config missing
        /// -> Throws InvalidOperationException with message about config.
        /// </summary>
        [Fact]
        public async Task UTCID03_GenerateQrAsync_ConfigMissing_ThrowsInvalidOperationException()
        {
            // Arrange - don't setup VietQR config (returns null by default)
            _mockConfiguration.Setup(c => c["VietQr:ApiKey"]).Returns((string?)null);
            _mockConfiguration.Setup(c => c["VietQr:ClientId"]).Returns((string?)null);
            _mockConfiguration.Setup(c => c["VietQr:AccountInfo:AccountNo"]).Returns((string?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.GenerateQrAsync(50000, "userId1months1"));

            Assert.Contains("Cấu hình VietQR", ex.Message);
        }

        /// <summary>
        /// UTCID04: VietQR API returns error code "99"
        /// -> Throws InvalidOperationException with message about API error.
        /// </summary>
        [Fact]
        public async Task UTCID04_GenerateQrAsync_ApiError_ThrowsInvalidOperationException()
        {
            // Arrange
            SetupVietQrConfig();

            var responseJson = JsonSerializer.Serialize(new
            {
                code = "99",
                desc = "API error occurred"
            });

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
            };
            SetupHttpClient(response);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.GenerateQrAsync(50000, "userId1months1"));

            Assert.Contains("Lỗi khi gọi VietQR API", ex.Message);
        }

        /// <summary>
        /// UTCID05: Response missing qrDataURL
        /// -> Throws InvalidOperationException with message about missing data.
        /// </summary>
        [Fact]
        public async Task UTCID05_GenerateQrAsync_MissingQrDataUrl_ThrowsInvalidOperationException()
        {
            // Arrange
            SetupVietQrConfig();

            var responseJson = JsonSerializer.Serialize(new
            {
                code = "00",
                data = new { } // Missing qrDataURL
            });

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
            };
            SetupHttpClient(response);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.GenerateQrAsync(50000, "userId1months1"));

            Assert.Contains("Response không có", ex.Message);
        }

        /// <summary>
        /// UTCID06: Different addInfo format (userId2months3)
        /// -> Returns byte[] (QR image bytes).
        /// </summary>
        [Fact]
        public async Task UTCID06_GenerateQrAsync_DifferentAddInfoFormat_ReturnsQrBytes()
        {
            // Arrange
            SetupVietQrConfig();

            // Use base64 encoded simple image data
            var base64Image = Convert.ToBase64String(Encoding.UTF8.GetBytes("fake-image-data"));
            var responseJson = JsonSerializer.Serialize(new
            {
                code = "00",
                data = new { qrDataURL = $"data:image/png;base64,{base64Image}" }
            });

            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json")
            };
            SetupHttpClient(response);

            // Act
            var result = await _service.GenerateQrAsync(50000, "userId2months3");

            // Assert
            Assert.NotNull(result);
            Assert.IsType<byte[]>(result);
            Assert.True(result.Length > 0);
        }

        /// <summary>
        /// UTCID07: Invalid addInfo format
        /// -> Throws InvalidOperationException with message about format.
        /// </summary>
        [Fact]
        public async Task UTCID07_GenerateQrAsync_InvalidAddInfoFormat_ThrowsInvalidOperationException()
        {
            // Arrange
            SetupVietQrConfig();

            // Act & Assert - invalid format (uses underscore instead of correct format)
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.GenerateQrAsync(50000, "userId_1_months_1"));

            Assert.Contains("Format addInfo không hợp lệ", ex.Message);
        }
    }
}
