using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace BE.Tests.Services.OtpServiceTest
{
    public class SendOtpAsyncTest : IDisposable
    {
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IKickboxClient> _mockKickboxClient;
        private readonly Mock<IUserRepository> _mockUserRepo;
        private readonly IMemoryCache _cache;
        private readonly OtpService _service;

        public SendOtpAsyncTest()
        {
            _mockEmailService = new Mock<IEmailService>();
            _mockKickboxClient = new Mock<IKickboxClient>();
            _mockUserRepo = new Mock<IUserRepository>();
            _cache = new MemoryCache(new MemoryCacheOptions());

            _service = new OtpService(
                _mockEmailService.Object,
                _cache,
                _mockKickboxClient.Object,
                _mockUserRepo.Object);
        }

        public void Dispose()
        {
            _cache.Dispose();
        }

        /// <summary>
        /// UTCID01: Valid email, SMTP success
        /// -> Returns success message, OTP cached.
        /// </summary>
        [Fact]
        public async Task UTCID01_SendOtpAsync_ValidEmail_ReturnsSuccess()
        {
            // Arrange
            const string email = "test@example.com";

            _mockUserRepo
                .Setup(r => r.EmailExistsAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false); // Email doesn't exist for register purpose

            _mockEmailService
                .Setup(s => s.SendEmailAsync(email, It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.SendOtpAsync(email, "register");

            // Assert
            Assert.NotNull(result);
            var type = result.GetType();
            var message = type.GetProperty("message")?.GetValue(result) as string;
            Assert.NotNull(message);
            Assert.Contains("OTP", message);

            // Verify OTP was cached
            var cacheKey = $"otp_{email}";
            Assert.True(_cache.TryGetValue(cacheKey, out string? cachedOtp));
            Assert.NotNull(cachedOtp);
            Assert.Equal(6, cachedOtp.Length);
        }

        /// <summary>
        /// UTCID02: Valid email, SMTP failed
        /// -> Throws InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID02_SendOtpAsync_SmtpFailed_ThrowsInvalidOperationException()
        {
            // Arrange
            const string email = "test@example.com";

            _mockUserRepo
                .Setup(r => r.EmailExistsAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            _mockEmailService
                .Setup(s => s.SendEmailAsync(email, It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("SMTP connection failed"));

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.SendOtpAsync(email, "register"));

            Assert.Contains("Lỗi khi gửi email", ex.Message);
        }

        /// <summary>
        /// UTCID03: Valid email, Gmail API error
        /// -> Throws InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task UTCID03_SendOtpAsync_GmailApiError_ThrowsInvalidOperationException()
        {
            // Arrange
            const string email = "test@example.com";

            _mockUserRepo
                .Setup(r => r.EmailExistsAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            _mockEmailService
                .Setup(s => s.SendEmailAsync(email, It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Google.GoogleApiException("Gmail", "Undeliverable email"));

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.SendOtpAsync(email, "register"));

            Assert.Contains("Gmail API", ex.Message);
        }

        /// <summary>
        /// UTCID04: Email already registered (for register purpose)
        /// -> Throws ArgumentException.
        /// </summary>
        [Fact]
        public async Task UTCID04_SendOtpAsync_EmailAlreadyRegistered_ThrowsArgumentException()
        {
            // Arrange
            const string email = "existing@example.com";

            _mockUserRepo
                .Setup(r => r.EmailExistsAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true); // Email already exists

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.SendOtpAsync(email, "register"));

            Assert.Contains("đã được đăng ký", ex.Message);
        }

        /// <summary>
        /// UTCID05: Invalid email format
        /// -> Throws ArgumentException.
        /// </summary>
        [Fact]
        public async Task UTCID05_SendOtpAsync_InvalidEmailFormat_ThrowsArgumentException()
        {
            // Arrange
            const string email = "invalid-email-format";

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.SendOtpAsync(email, "register"));

            Assert.Contains("không hợp lệ", ex.Message);
        }

        /// <summary>
        /// UTCID06: Empty/null email
        /// -> Throws ArgumentException.
        /// </summary>
        [Fact]
        public async Task UTCID06_SendOtpAsync_EmptyEmail_ThrowsArgumentException()
        {
            // Arrange
            const string email = "";

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.SendOtpAsync(email, "register"));

            Assert.Contains("không được để trống", ex.Message);
        }

        /// <summary>
        /// UTCID07: Forgot password - Email not found
        /// -> Throws ArgumentException.
        /// </summary>
        [Fact]
        public async Task UTCID07_SendOtpAsync_ForgotPasswordEmailNotExists_ThrowsArgumentException()
        {
            // Arrange
            const string email = "notfound@example.com";

            _mockUserRepo
                .Setup(r => r.EmailExistsAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false); // Email doesn't exist

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.SendOtpAsync(email, "forgot-password"));

            Assert.Contains("không tồn tại", ex.Message);
        }
    }
}
