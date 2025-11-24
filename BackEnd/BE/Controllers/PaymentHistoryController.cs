using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace BE.Controllers
{
	/// <summary>
	/// Controller cho PaymentHistory - chỉ nhận request và trả response
	/// </summary>
	[ApiController]
	[Route("api/payment-history")]
	public class PaymentHistoryController : ControllerBase
	{
		private readonly IPaymentHistoryService _paymentHistoryService;

		public PaymentHistoryController(IPaymentHistoryService paymentHistoryService)
		{
			_paymentHistoryService = paymentHistoryService;
		}

		// POST /api/payment-history/generate
		[HttpPost("generate")]
		//[Authorize(Roles = "User")]
		public async Task<IActionResult> GenerateQr([FromQuery] decimal amount, [FromQuery] string addInfo, CancellationToken ct = default)
		{
			try
			{
				var qrBytes = await _paymentHistoryService.GenerateQrAsync(amount, addInfo, ct);
				return File(qrBytes, "image/png");
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

		[HttpPost("callback")]
		public async Task<IActionResult> PaymentCallback([FromBody] JsonElement notification, [FromHeader(Name = "Authorization")] string? authHeader, CancellationToken ct = default)
		{
			try
			{
				// Xác thực webhook từ SePay
				var isValid = await _paymentHistoryService.ValidateWebhookAsync(authHeader, ct);
				if (!isValid)
				{
					return Unauthorized(new { success = false, message = "Webhook không hợp lệ", receivedAuth = authHeader });
				}

				// Parse thông tin từ SePay callback
				var result = await _paymentHistoryService.ProcessPaymentCallbackAsync(notification, ct);
				return Ok(result);
			}
			catch (Exception ex)
			{
				// Log lỗi nhưng vẫn trả OK cho SePay để tránh retry
				return Ok(new { success = false, message = ex.Message });
			}
		}

		// POST /api/payment-history
		[HttpPost]
		//[Authorize(Roles = "User")]
		public async Task<IActionResult> CreatePaymentHistory([FromBody] CreatePaymentHistoryRequest request, CancellationToken ct = default)
		{
			try
			{
				var result = await _paymentHistoryService.CreatePaymentHistoryAsync(request, ct);
				return Ok(result);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Lỗi khi tạo payment history",
					error = ex.Message
				});
			}
		}

		// GET /api/payment-history/user/{userId}
		[HttpGet("user/{userId:int}")]
		[Authorize(Roles = "User")]
		public async Task<IActionResult> GetPaymentHistoryByUserId(int userId, CancellationToken ct = default)
		{
			try
			{
				var histories = await _paymentHistoryService.GetPaymentHistoriesByUserIdAsync(userId, ct);
				return Ok(new
				{
					success = true,
					data = histories
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Lỗi khi lấy payment history",
					error = ex.Message
				});
			}
		}

		// GET /api/payment-history/user/{userId}/vip-status
		[HttpGet("user/{userId:int}/vip-status")]
		[Authorize(Roles = "User")]
		public async Task<IActionResult> GetVipStatus(int userId, CancellationToken ct = default)
		{
			try
			{
				var result = await _paymentHistoryService.GetVipStatusAsync(userId, ct);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Lỗi khi check VIP status",
					error = ex.Message
				});
			}
		}

		// GET /api/payment-history/check-payment?userId={userId}&amount={amount}&description={description}
		[HttpGet("check-payment")]
		[Authorize(Roles = "User")]
		public async Task<IActionResult> CheckPaymentStatus(
			[FromQuery] int userId, 
			[FromQuery] decimal amount, 
			[FromQuery] string description, 
			CancellationToken ct = default)
		{
			try
			{
				var result = await _paymentHistoryService.CheckPaymentStatusAsync(userId, amount, description, ct);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Lỗi khi kiểm tra trạng thái thanh toán",
					error = ex.Message
				});
			}
		}
	}
}
