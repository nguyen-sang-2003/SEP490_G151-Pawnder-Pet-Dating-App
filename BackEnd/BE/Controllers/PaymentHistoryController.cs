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

		// GET /api/payment-history/all
		[HttpGet("all")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> GetAllPaymentHistories(CancellationToken ct = default)
		{
			try
			{
				var histories = await _paymentHistoryService.GetAllPaymentHistoriesAsync(ct);
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
					message = "Lỗi khi lấy danh sách payment history",
					error = ex.Message
				});
			}
		}

	// POST /api/payment-history/generate
	[HttpPost("generate")]
	[Authorize(Roles = "User")]
	public async Task<IActionResult> GenerateQr([FromBody] GenerateQrRequest request, CancellationToken ct = default)
	{
		try
		{
		// Validate request
		if (request == null)
		{
			return BadRequest(new { message = "Request body không được để trống" });
		}

		if (request.Amount <= 0)
		{
			return BadRequest(new { message = "Amount phải lớn hơn 0" });
		}

		if (request.Amount < 10000)
		{
			return BadRequest(new { message = "Số tiền tối thiểu là 10,000đ" });
		}

		if (request.Months <= 0)
		{
			return BadRequest(new { message = "Months phải lớn hơn 0" });
		}

			// Lấy userId từ token JWT (sử dụng ClaimTypes.NameIdentifier)
			var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
			if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
			{
				return Unauthorized(new { message = "Không tìm thấy thông tin user trong token" });
			}

		// Lấy amount và months từ request body
		decimal amount = request.Amount;
		int months = request.Months;
		string addInfo = $"userId{userId}months{months}";

		var qrBytes = await _paymentHistoryService.GenerateQrAsync(amount, addInfo, ct);
		return File(qrBytes, "image/png");
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { success = false, message = ex.Message });
		}
		catch (Exception ex)
		{
			return StatusCode(500, new { success = false, message = "Lỗi hệ thống", error = ex.Message });
		}
	}

	// POST /api/payment-history/callback
	// Kiểm tra có giao dịch thanh toán từ SePay khớp với amount và content
	[HttpPost("callback")]
	[Authorize(Roles = "User")]
	public async Task<IActionResult> PaymentCallback([FromBody] PaymentCallbackRequest request, CancellationToken ct = default)
	{
		try
		{
		// Validate request
		if (request == null)
		{
			return BadRequest(new { success = false, message = "Request body không được để trống" });
		}

		if (request.TransferAmount <= 0)
		{
			return BadRequest(new { success = false, message = "TransferAmount phải lớn hơn 0" });
		}

		if (request.TransferAmount < 10000)
		{
			return BadRequest(new { success = false, message = "Số tiền tối thiểu là 10,000đ" });
		}

		if (string.IsNullOrEmpty(request.Content))
		{
			return BadRequest(new { success = false, message = "Content không được để trống" });
		}

			// Lấy userId từ token JWT
			var userId = GetUserIdFromToken();
			if (userId == null)
			{
				return Unauthorized(new { success = false, message = "Không tìm thấy thông tin user trong token" });
			}

			// Kiểm tra có giao dịch từ SePay khớp với amount và content
			var result = await _paymentHistoryService.CheckPaymentInLastHourAsync(
				userId.Value, 
				request.TransferAmount, 
				request.Content, 
				ct);

			return Ok(result);
		}
		catch (Exception ex)
		{
			return StatusCode(500, new { 
				success = false, 
				message = "Lỗi khi kiểm tra thanh toán", 
				error = ex.Message 
			});
		}
	}

	// Phương thức để lấy userId từ JWT token
	private int? GetUserIdFromToken()
	{
		var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
		if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
		{
			return null;
		}
		return userId;
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

	}
}

public class GenerateQrRequest
{
	public decimal Amount { get; set; }  // Số tiền thanh toán (VNĐ)
	public int Months { get; set; }      // Số tháng VIP (1, 3, 6, 12)
}

public class PaymentCallbackRequest
{
	public decimal TransferAmount { get; set; }  // Số tiền đã chuyển
	public string Content { get; set; } = null!;  // Nội dung chuyển khoản (userIdXmonthsY)
}
