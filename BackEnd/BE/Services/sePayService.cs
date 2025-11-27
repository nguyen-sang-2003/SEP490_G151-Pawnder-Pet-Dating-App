using System.Net.Http.Headers;
using System.Text.Json;

namespace BE.Services
{
	public class sePayService
	{
		private readonly HttpClient _client;
		private readonly IConfiguration _config;

		public sePayService(IConfiguration config)
		{
			_config = config;
			_client = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
		}

		// Lấy danh sách giao dịch
		public async Task GetTransactionsAsync()
		{
			var sepaySection = _config.GetSection("Sepay");
			string apiUrl = sepaySection["ApiUrl"] ?? throw new ArgumentNullException("Sepay:ApiUrl is required");
			string apiKey = sepaySection["ApiKey"] ?? throw new ArgumentNullException("Sepay:ApiKey is required");
			string accountNumber = sepaySection["AccountNumber"] ?? throw new ArgumentNullException("Sepay:AccountNumber is required");
			int limit = int.Parse(sepaySection["Limit"] ?? "20");

			_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
			_client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

			string requestUrl = $"{apiUrl}?account_number={accountNumber}&limit={limit}";

			Console.WriteLine($"Gọi API SePay (production): {requestUrl}");

			var response = await CallWithRetryAsync(requestUrl, 3);
			string result = await response.Content.ReadAsStringAsync();
			Console.WriteLine(result);
		}

		// Lấy chi tiết một giao dịch theo transaction_id
		public async Task GetTransactionDetailsAsync(string transactionId)
		{
			if (string.IsNullOrWhiteSpace(transactionId))
				throw new ArgumentException("Transaction ID không được để trống.", nameof(transactionId));

			var sepaySection = _config.GetSection("Sepay");
			string apiKey = sepaySection["ApiKey"] ?? throw new ArgumentNullException("Sepay:ApiKey is required");
			string detailUrl = $"https://my.sepay.vn/userapi/transactions/details/{transactionId}";

			_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
			_client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

			Console.WriteLine($"Gọi API chi tiết giao dịch: {detailUrl}");

			var response = await CallWithRetryAsync(detailUrl, 3);
			string result = await response.Content.ReadAsStringAsync();

			if (response.IsSuccessStatusCode)
			{
				Console.WriteLine("Chi tiết giao dịch:");
				Console.WriteLine(JsonSerializer.Serialize(
					JsonDocument.Parse(result).RootElement,
					new JsonSerializerOptions { WriteIndented = true }
				));
			}
			else
			{
				Console.WriteLine($"Lỗi {response.StatusCode}: {result}");
			}
		}

		// Retry logic chung cho cả 2 API
		private async Task<HttpResponseMessage> CallWithRetryAsync(string url, int maxRetries)
		{
			for (int i = 1; i <= maxRetries; i++)
			{
				try
				{
					var response = await _client.GetAsync(url);
					if (response.IsSuccessStatusCode)
						return response;

					Console.WriteLine($"Lần {i}: API trả về {response.StatusCode}");
					await Task.Delay(1000 * i);
				}
				catch (HttpRequestException e)
				{
					Console.WriteLine($"Lỗi kết nối (lần {i}): {e.Message}");
					await Task.Delay(1000 * i);
				}
			}

			throw new Exception("Không thể kết nối API SePay sau nhiều lần thử.");
		}
	}
}
