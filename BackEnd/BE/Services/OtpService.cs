using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Text.RegularExpressions;

namespace BE.Services
{
    public class OtpService : IOtpService
    {
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _cache;
        private readonly IKickboxClient _kickboxClient;
        private readonly IUserRepository _userRepository;

        public OtpService(
            IEmailService emailService,
            IMemoryCache cache,
            IKickboxClient kickboxClient,
            IUserRepository userRepository)
        {
            _emailService = emailService;
            _cache = cache;
            _kickboxClient = kickboxClient;
            _userRepository = userRepository;
        }

        public async Task<object> SendOtpAsync(string email, string purpose = "register", CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email không được để trống.");

            // Business logic: Validate email format
            if (!IsValidEmail(email))
                throw new ArgumentException("Địa chỉ email không hợp lệ.");

            // Business logic: Check email based on purpose
            var emailExists = await _userRepository.EmailExistsAsync(email, ct);
            
            if (purpose == "register" && emailExists)
            {
                throw new ArgumentException("Email đã được đăng ký trong hệ thống.");
            }
            
            if (purpose == "forgot-password" && !emailExists)
            {
                throw new ArgumentException("Email không tồn tại trong hệ thống.");
            }

            // Business logic: Generate OTP
            var otp = new Random().Next(100000, 999999).ToString();

            var subject = "Mã OTP xác thực từ Pawnder";
            var body = $@"
                <p>Xin chào,</p>
                <p>Mã OTP của bạn là: <b>{otp}</b></p>
                <p>Mã có hiệu lực trong 5 phút.</p>
                <p>Trân trọng,<br>Pawnder Team</p>
            ";

            try
            {
                await _emailService.SendEmailAsync(email, subject, body);

                // Business logic: Cache OTP for 5 minutes
                var cacheKey = $"otp_{email}";
                _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(5));

                return new { message = "Đã gửi OTP tới email người dùng." };
            }
            catch (Google.GoogleApiException ex)
            {
                throw new InvalidOperationException($"Lỗi Gmail API khi gửi email: {ex.Message}");
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Lỗi khi gửi email: {ex.Message}");
            }
        }

        public Task<bool> CheckOtpAsync(string email, string otp, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otp))
                throw new ArgumentException("Thiếu email hoặc mã OTP.");

            var cacheKey = $"otp_{email}";
            if (_cache.TryGetValue(cacheKey, out string? cachedOtp))
            {
                if (cachedOtp == otp)
                {
                    _cache.Remove(cacheKey);
                    return Task.FromResult(true);
                }
                else
                {
                    throw new InvalidOperationException("Mã OTP không chính xác.");
                }
            }

            throw new InvalidOperationException("OTP đã hết hạn hoặc chưa được gửi.");
        }

        private static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            // Regex pattern để validate email format
            var emailPattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
            return Regex.IsMatch(email, emailPattern, RegexOptions.IgnoreCase);
        }
    }
}




