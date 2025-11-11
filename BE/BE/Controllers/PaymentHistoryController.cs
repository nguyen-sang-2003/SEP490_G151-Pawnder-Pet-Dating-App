using BE.Services;
using BE.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace BE.Controllers
{
	[ApiController]
	[Route("api/payment-history")]
	public class PaymentHistoryController : ControllerBase
	{
		private readonly IHttpClientFactory _httpClientFactory;
		private readonly IConfiguration _configuration;
		private readonly PawnderDatabaseContext _context;

		public PaymentHistoryController(
			IHttpClientFactory httpClientFactory, 
			IConfiguration configuration,
			PawnderDatabaseContext context)
		{
			_httpClientFactory = httpClientFactory;
			_configuration = configuration;
			_context = context;
		}

		// Endpoint tạo QR từ config, nhận số tiền và ghi chú
		[HttpPost("generate")]
		public async Task<IActionResult> GenerateQr([FromQuery] decimal amount, [FromQuery] string addInfo)
		{
			var apiKey = _configuration["VietQr:ApiKey"];
			var clientId = _configuration["VietQr:ClientId"];
			var accountNo = _configuration["VietQr:AccountInfo:AccountNo"];
			var accountName = _configuration["VietQr:AccountInfo:AccountName"];
			var acqId = _configuration["VietQr:AccountInfo:AcqId"];
			var template = _configuration["VietQr:AccountInfo:Template"];

			if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(accountNo))
				return StatusCode(500, new { message = "Cấu hình VietQR chưa đầy đủ." });

			var client = _httpClientFactory.CreateClient();
			client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
			client.DefaultRequestHeaders.Add("Accept", "application/json");
			client.DefaultRequestHeaders.Add("X-Client-ID", clientId);

			var payload = new
			{
				accountNo = accountNo,
				accountName = accountName,
				acqId = acqId,
				addInfo = addInfo,
				amount = amount,
				template = template
			};

			string jsonPayload = JsonSerializer.Serialize(payload);
			var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

			var response = await client.PostAsync("https://api.vietqr.io/v2/generate", content);
			var responseContent = await response.Content.ReadAsStringAsync();

			var root = JsonDocument.Parse(responseContent).RootElement;

			if (root.TryGetProperty("code", out var codeProp) && codeProp.GetString() == "00")
			{
				if (root.TryGetProperty("data", out var dataProp) &&
					dataProp.TryGetProperty("qrDataURL", out var qrProp))
				{
					string qrDataUrl = qrProp.GetString();
					string base64Data = qrDataUrl.Split(",")[1];
					byte[] qrBytes = Convert.FromBase64String(base64Data);

					return File(qrBytes, "image/png");
				}
				else
				{
					return BadRequest(new { message = "Response không có trường data.qrDataURL." });
				}
			}
			else
			{
				var msg = root.TryGetProperty("desc", out var descProp)
					? descProp.GetString()
					: root.ToString();
				return BadRequest(new { message = "Lỗi khi gọi VietQR API.", response = msg });
			}
		}

		[HttpPost("callback")]
		public IActionResult PaymentCallback([FromBody] JsonElement notification)
		{
			// Cập nhật trạng thái thanh toán đơn hàng
			return Ok();
		}

		/// <summary>
		/// POST /api/payment-history
		/// Tạo payment history (tạm thời không cần verify thanh toán thật)
		/// </summary>
		[HttpPost]
		public async Task<IActionResult> CreatePaymentHistory([FromBody] CreatePaymentHistoryRequest request)
		{
			try
			{
				// Validate user exists
				var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId);
				if (user == null)
					return NotFound(new { message = "User không tồn tại" });

				// Calculate dates based on duration (in months)
				var startDate = DateOnly.FromDateTime(DateTime.Now);
				var endDate = startDate.AddMonths(request.DurationMonths);

				// Create payment history record
				var paymentHistory = new PaymentHistory
				{
					UserId = request.UserId,
					StatusService = "active",
					StartDate = startDate,
					EndDate = endDate,
					CreatedAt = DateTime.Now,
					UpdatedAt = DateTime.Now
				};

				_context.PaymentHistories.Add(paymentHistory);
				await _context.SaveChangesAsync();

				return Ok(new
				{
					success = true,
					message = "Thanh toán thành công! Tài khoản VIP đã được kích hoạt.",
					data = new
					{
						historyId = paymentHistory.HistoryId,
						userId = paymentHistory.UserId,
						statusService = paymentHistory.StatusService,
						startDate = paymentHistory.StartDate,
						endDate = paymentHistory.EndDate,
						durationMonths = request.DurationMonths
					}
				});
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

		/// <summary>
		/// GET /api/payment-history/user/{userId}
		/// Lấy payment history của user
		/// </summary>
		[HttpGet("user/{userId:int}")]
		public async Task<IActionResult> GetPaymentHistoryByUserId(int userId)
		{
			try
			{
				var histories = await _context.PaymentHistories
					.Where(ph => ph.UserId == userId)
					.OrderByDescending(ph => ph.CreatedAt)
					.Select(ph => new
					{
						historyId = ph.HistoryId,
						userId = ph.UserId,
						statusService = ph.StatusService,
						startDate = ph.StartDate,
						endDate = ph.EndDate,
						createdAt = ph.CreatedAt,
						updatedAt = ph.UpdatedAt
					})
					.ToListAsync();

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

		/// <summary>
		/// GET /api/payment-history/user/{userId}/vip-status
		/// Check xem user có VIP active không
		/// </summary>
		[HttpGet("user/{userId:int}/vip-status")]
		public async Task<IActionResult> GetVipStatus(int userId)
		{
			try
			{
				var today = DateOnly.FromDateTime(DateTime.Now);

				var activeSubscription = await _context.PaymentHistories
					.Where(ph => ph.UserId == userId
						&& ph.StatusService != null
						&& ph.StatusService.ToLower().Contains("active")
						&& ph.StartDate <= today
						&& ph.EndDate >= today)
					.OrderByDescending(ph => ph.EndDate)
					.Select(ph => new
					{
						historyId = ph.HistoryId,
						statusService = ph.StatusService,
						startDate = ph.StartDate,
						endDate = ph.EndDate,
						daysRemaining = ph.EndDate.HasValue 
							? ph.EndDate.Value.DayNumber - today.DayNumber 
							: 0
					})
					.FirstOrDefaultAsync();

				if (activeSubscription != null)
				{
					return Ok(new
					{
						success = true,
						isVip = true,
						subscription = activeSubscription
					});
				}

				return Ok(new
				{
					success = true,
					isVip = false,
					subscription = (object?)null
				});
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

	/// <summary>
	/// DTO for creating payment history
	/// </summary>
	public record CreatePaymentHistoryRequest
	{
		public int UserId { get; init; }
		public int DurationMonths { get; init; }  // 1, 3, 6, hoặc 12 tháng
		public decimal Amount { get; init; }       // Số tiền thanh toán
		public string? PlanName { get; init; }     // Tên gói (VD: "Premium 3 tháng")
	}
}
