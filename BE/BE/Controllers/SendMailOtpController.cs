using BE.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace BE.Controllers
{
    [ApiController]
    [Route("api")]
    public class SendMailOtpController : ControllerBase
    {
        private readonly EmailService _emailService;
        private readonly IMemoryCache _cache;
        private readonly IKickboxClient _kickboxClient;

        public SendMailOtpController(EmailService emailService, IMemoryCache cache, IKickboxClient kickboxClient)
        {
            _emailService = emailService;
            _cache = cache;
            _kickboxClient = kickboxClient;
        }

        // GET /send-mail-otp
        [HttpGet("send-mail-otp")]
        public async Task<IActionResult> SendOtp([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email không được để trống." });

            // ✅ Kiểm tra định dạng email
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                if (addr.Address != email)
                    return BadRequest(new { message = "Địa chỉ email không hợp lệ." });
            }
            catch
            {
                return BadRequest(new { message = "Địa chỉ email không hợp lệ." });
            }

            // ✅ Kiểm tra domain email có tồn tại không (VD: gmail.com, yahoo.com,…)
            var domain = email.Split('@').Last();
            try
            {
                var entry = await System.Net.Dns.GetHostEntryAsync(domain);
                if (entry == null)
                    return BadRequest(new { message = "Tên miền email không tồn tại." });
            }
            catch
            {
                return BadRequest(new { message = "Tên miền email không tồn tại hoặc không hợp lệ." });
            }

            // ✅ Kiểm tra Kickbox: khả năng giao nhận
            var verify = await _kickboxClient.VerifyEmailAsync(email);
            if (verify.Result.Equals("undeliverable", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = $"Email không thể nhận thư (undeliverable): {verify.Reason}" });
            }

            // ✅ Sinh mã OTP ngẫu nhiên 6 chữ số
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

                // ✅ Lưu OTP vào cache trong 5 phút
                var cacheKey = $"otp_{email}";
                _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(5));

                return Ok(new { message = "Đã gửi OTP tới email người dùng." });
            }
            catch (System.Net.Mail.SmtpFailedRecipientException)
            {
                // ❌ Lỗi gửi đến email không tồn tại hoặc bị từ chối
                return BadRequest(new { message = "Không gửi được email: người nhận không tồn tại hoặc bị từ chối." });
            }
            catch (System.Net.Mail.SmtpException ex)
            {
                // ❌ Lỗi từ SMTP server (sai cấu hình, mạng, xác thực, v.v.)
                return StatusCode(500, new { message = "Lỗi SMTP khi gửi email.", error = ex.Message });
            }
            catch (Exception ex)
            {
                // ❌ Lỗi tổng quát khác
                return StatusCode(500, new { message = "Gửi email thất bại.", error = ex.Message });
            }
        }


        // POST /check-otp
        [HttpPost("check-otp")]
        public IActionResult CheckOtp([FromBody] OtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Otp))
                return BadRequest(new { message = "Thiếu email hoặc mã OTP." });

            var cacheKey = $"otp_{request.Email}";
            if (_cache.TryGetValue(cacheKey, out string? cachedOtp))
            {
                if (cachedOtp == request.Otp)
                {
                    _cache.Remove(cacheKey); 
                    return Ok(new { message = "Xác thực OTP thành công." });
                }
                else
                {
                    return BadRequest(new { message = "Mã OTP không chính xác." });
                }
            }

            return BadRequest(new { message = "OTP đã hết hạn hoặc chưa được gửi." });
        }
    }
    public class OtpRequest
    {
        public string Email { get; set; } = null!;
        public string Otp { get; set; } = null!;
    }
}
