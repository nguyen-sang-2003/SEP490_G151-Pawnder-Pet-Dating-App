using BE.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace BE.Controllers
{
	[ApiController]
	public class PaymentHistoryController : ControllerBase
	{
		private readonly IHttpClientFactory _httpClientFactory;
		private readonly IConfiguration _configuration;

		public PaymentHistoryController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
		{
			_httpClientFactory = httpClientFactory;
			_configuration = configuration;
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
	}
}
