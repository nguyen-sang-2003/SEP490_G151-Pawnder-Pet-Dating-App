using BE.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace BE.Services
{
    public class OtpService : IOtpService
    {
        private readonly EmailService _emailService;
        private readonly IMemoryCache _cache;
        private readonly IKickboxClient _kickboxClient;

        public OtpService(
            EmailService emailService,
            IMemoryCache cache,
            IKickboxClient kickboxClient)
        {
            _emailService = emailService;
            _cache = cache;
            _kickboxClient = kickboxClient;
        }

        public async Task<object> SendOtpAsync(string email, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email không được để trống.");

            // Business logic: Validate email format
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                if (addr.Address != email)
                    throw new ArgumentException("Địa chỉ email không hợp lệ.");
            }
            catch
            {
                throw new ArgumentException("Địa chỉ email không hợp lệ.");
            }

            // Business logic: Validate domain exists
            var domain = email.Split('@').Last();
            try
            {
                var entry = await System.Net.Dns.GetHostEntryAsync(domain);
                if (entry == null)
                    throw new ArgumentException("Tên miền email không tồn tại.");
            }
            catch
            {
                throw new ArgumentException("Tên miền email không tồn tại hoặc không hợp lệ.");
            }

            // Business logic: Verify email with Kickbox
            var verify = await _kickboxClient.VerifyEmailAsync(email);
            if (verify.Result.Equals("undeliverable", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Email không thể nhận thư (undeliverable): {verify.Reason}");
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
            catch (System.Net.Mail.SmtpFailedRecipientException)
            {
                throw new InvalidOperationException("Không gửi được email: người nhận không tồn tại hoặc bị từ chối.");
            }
            catch (System.Net.Mail.SmtpException ex)
            {
                throw new InvalidOperationException($"Lỗi SMTP khi gửi email: {ex.Message}");
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
    }
}




