using Microsoft.AspNetCore.Mvc;
using BE.Services;

namespace BE.Controllers
{
    [ApiController]
    [Route("api")]
    public class SendMailOtpController : ControllerBase
    {
        private readonly EmailService _emailService;

        public SendMailOtpController(EmailService emailService)
        {
            _emailService = emailService;
        }

        // GET /send-mail-otp
        [HttpGet("send-mail-otp")]
        public async Task<IActionResult> SendOtp([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email không được để trống." });

            // Sinh mã OTP ngẫu nhiên 6 chữ số
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

                return Ok(new
                {
                    message = "Đã gửi OTP tới email người dùng.",
                    otp 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Gửi email thất bại.", error = ex.Message });
            }
        }
    }
}
