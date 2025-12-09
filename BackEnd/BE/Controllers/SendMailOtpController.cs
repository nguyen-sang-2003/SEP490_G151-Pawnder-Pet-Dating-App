using BE.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho OTP - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api")]
    public class SendMailOtpController : ControllerBase
    {
        private readonly IOtpService _otpService;

        public SendMailOtpController(IOtpService otpService)
        {
            _otpService = otpService;
        }

        // GET /send-mail-otp?email=xxx&purpose=register|forgot-password
        [HttpGet("send-mail-otp")]
        public async Task<IActionResult> SendOtp([FromQuery] string email, [FromQuery] string purpose = "register", CancellationToken ct = default)
        {
            try
            {
                var result = await _otpService.SendOtpAsync(email, purpose, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Gửi email thất bại.", error = ex.Message });
            }
        }

        // POST /check-otp
        [HttpPost("check-otp")]
        public async Task<IActionResult> CheckOtp([FromBody] OtpRequest request, CancellationToken ct = default)
        {
            try
            {
                var success = await _otpService.CheckOtpAsync(request.Email, request.Otp, ct);
                return Ok(new { message = "Xác thực OTP thành công." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }
    }

    public class OtpRequest
    {
        public string Email { get; set; } = null!;
        public string Otp { get; set; } = null!;
    }
}
