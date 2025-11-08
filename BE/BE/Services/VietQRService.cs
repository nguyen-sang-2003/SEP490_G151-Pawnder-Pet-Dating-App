using Newtonsoft.Json;
using System.Text;

namespace BE.Services
{
	public class VietQRService
	{
		private const string ApiUrl = "https://api.vietqr.io/v2/generate";

		private const string ClientId = "ec3bf1c5-b000-4ca9-91a0-e5f5e7cc7e36";
		private const string ApiKey = "96b7b6f3-65c3-405b-8103-f8a53494074f";

		public class VietQRRequest
		{
			public string accountNo { get; set; } = null!;
			public string accountName { get; set; } = null!;
			public string acqId { get; set; } = null!;
			public string addInfo { get; set; } = null!;
			public int amount { get; set; }
			public string template { get; set; } = "compact";
		}

		public class VietQRResponse
		{
			public string code { get; set; } = string.Empty;
			public string desc { get; set; } = string.Empty;
			public VietQRData? data { get; set; }

			public class VietQRData
			{
				public string qrDataURL { get; set; } = string.Empty;
			}
		}

		/// <summary>
		/// Gọi API VietQR để tạo mã QR thanh toán.
		/// </summary>
		/// <param name="request">Thông tin tài khoản, ngân hàng, số tiền, nội dung.</param>
		/// <returns>Đối tượng chứa mã QR (base64 image).</returns>
		public async Task<VietQRResponse> GenerateQRAsync(VietQRRequest request)
		{
			using var client = new HttpClient();

			// Thêm headers xác thực
			client.DefaultRequestHeaders.Add("x-client-id", ClientId);
			client.DefaultRequestHeaders.Add("x-api-key", ApiKey);

			// Serialize body JSON
			var json = JsonConvert.SerializeObject(request);
			var content = new StringContent(json, Encoding.UTF8, "application/json");

			// Gửi POST request
			var response = await client.PostAsync(ApiUrl, content);
			var result = await response.Content.ReadAsStringAsync();

			// Deserialize JSON trả về
			return JsonConvert.DeserializeObject<VietQRResponse>(result)!;
		}
	}
}

