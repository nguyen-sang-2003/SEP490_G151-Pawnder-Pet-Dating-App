using BE.Repositories.Interfaces;
using BE.Services;
using BE.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace BE.Tests.Services.OtpServiceTest
{
    public class CheckOtpAsyncTest : IDisposable
    {
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IKickboxClient> _mockKickboxClient;
        private readonly Mock<IUserRepository> _mockUserRepo;
        private readonly IMemoryCache _cache;
        private readonly OtpService _service;

        public CheckOtpAsyncTest()
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
        /// UTCID01: Valid email, valid OTP, OTP matches cache
        /// -> Returns TRUE, cache entry removed.
        /// </summary>
        [Fact]
        public async Task UTCID01_CheckOtpAsync_CorrectOtp_ReturnsTrue()
        {
            // Arrange
            const string email = "test@example.com";
            const string otp = "123456";
            var cacheKey = $"otp_{email}";

            // Pre-populate cache with OTP
            _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(5));

            // Act
            var result = await _service.CheckOtpAsync(email, otp);

            // Assert
            Assert.True(result);

            // Verify OTP was removed from cache after successful verification
            Assert.False(_cache.TryGetValue(cacheKey, out string? _));
        }

        /// <summary>
        /// UTCID02: Valid email, OTP doesn't match
        /// -> Throws InvalidOperationException "Mã OTP không chính xác."
        /// </summary>
        [Fact]
        public async Task UTCID02_CheckOtpAsync_IncorrectOtp_ThrowsInvalidOperationException()
        {
            // Arrange
            const string email = "test@example.com";
            const string correctOtp = "123456";
            const string wrongOtp = "654321";
            var cacheKey = $"otp_{email}";

            // Pre-populate cache with correct OTP
            _cache.Set(cacheKey, correctOtp, TimeSpan.FromMinutes(5));

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CheckOtpAsync(email, wrongOtp));

            Assert.Contains("Mã OTP không chính xác", ex.Message);

            // Verify OTP is still in cache after failed attempt
            Assert.True(_cache.TryGetValue(cacheKey, out string? cachedOtp));
            Assert.Equal(correctOtp, cachedOtp);
        }

        /// <summary>
        /// UTCID03: Valid email, OTP expired/not found in cache
        /// -> Throws InvalidOperationException "OTP đã hết hạn hoặc chưa được gửi."
        /// </summary>
        [Fact]
        public async Task UTCID03_CheckOtpAsync_OtpExpired_ThrowsInvalidOperationException()
        {
            // Arrange
            const string email = "test@example.com";
            const string otp = "123456";
            // No OTP in cache (simulates expired or never sent)

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CheckOtpAsync(email, otp));

            Assert.Contains("OTP đã hết hạn hoặc chưa được gửi", ex.Message);
        }

        /// <summary>
        /// UTCID04: Different email lookup (OTP exists for another email)
        /// -> Throws InvalidOperationException "OTP đã hết hạn hoặc chưa được gửi."
        /// </summary>
        [Fact]
        public async Task UTCID04_CheckOtpAsync_DifferentEmailLookup_ThrowsInvalidOperationException()
        {
            // Arrange
            const string originalEmail = "original@example.com";
            const string differentEmail = "different@example.com";
            const string otp = "123456";

            // Pre-populate cache with OTP for original email
            _cache.Set($"otp_{originalEmail}", otp, TimeSpan.FromMinutes(5));

            // Act & Assert - try to verify with different email
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CheckOtpAsync(differentEmail, otp));

            Assert.Contains("OTP đã hết hạn hoặc chưa được gửi", ex.Message);
        }

        /// <summary>
        /// UTCID05: Empty/null email or OTP
        /// -> Throws ArgumentException "Thiếu email hoặc mã OTP."
        /// </summary>
        [Fact]
        public async Task UTCID05_CheckOtpAsync_EmptyInput_ThrowsArgumentException()
        {
            // Act & Assert - empty email
            var ex1 = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CheckOtpAsync("", "123456"));
            Assert.Contains("Thiếu email hoặc mã OTP", ex1.Message);

            // Act & Assert - empty OTP
            var ex2 = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CheckOtpAsync("test@example.com", ""));
            Assert.Contains("Thiếu email hoặc mã OTP", ex2.Message);

            // Act & Assert - whitespace email
            var ex3 = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CheckOtpAsync("   ", "123456"));
            Assert.Contains("Thiếu email hoặc mã OTP", ex3.Message);

            // Act & Assert - whitespace OTP
            var ex4 = await Assert.ThrowsAsync<ArgumentException>(
                () => _service.CheckOtpAsync("test@example.com", "   "));
            Assert.Contains("Thiếu email hoặc mã OTP", ex4.Message);
        }
    }
}
