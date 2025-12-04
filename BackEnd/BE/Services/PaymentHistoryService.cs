using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Text.Json;

namespace BE.Services
{
    public class PaymentHistoryService : IPaymentHistoryService
    {
        private readonly IPaymentHistoryRepository _paymentHistoryRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public PaymentHistoryService(
            IPaymentHistoryRepository paymentHistoryRepository,
            PawnderDatabaseContext context,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _paymentHistoryRepository = paymentHistoryRepository;
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

	public async Task<byte[]> GenerateQrAsync(decimal amount, string addInfo, CancellationToken ct = default)
	{
		// Parse userId from addInfo - format: userIdXmonthsY (ví dụ: userId3months1)
		int userId = 0;
		var match = System.Text.RegularExpressions.Regex.Match(addInfo, @"userId(\d+)months(\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
		if (match.Success)
		{
			int.TryParse(match.Groups[1].Value, out userId);
		}
		else
		{
			throw new InvalidOperationException($"Format addInfo không hợp lệ: '{addInfo}'. Format đúng: userIdXmonthsY (ví dụ: userId3months1)");
		}

			// Check if user has active VIP
			var today = DateOnly.FromDateTime(DateTime.Today);
			var hasActiveVip = await _context.PaymentHistories.AnyAsync(p => p.UserId == userId && p.StatusService == "active" && p.EndDate >= today, ct);
			if (hasActiveVip)
			{
				throw new InvalidOperationException("Bạn đã có gói đăng ký VIP đang hoạt động. Vui lòng đợi đến khi gói đăng ký hết hạn trước khi gia hạn.");
			}

			var apiKey = _configuration["VietQr:ApiKey"];
			var clientId = _configuration["VietQr:ClientId"];
			var accountNo = _configuration["VietQr:AccountInfo:AccountNo"];
			var accountName = _configuration["VietQr:AccountInfo:AccountName"];
			var acqId = _configuration["VietQr:AccountInfo:AcqId"];
			var template = _configuration["VietQr:AccountInfo:Template"];

			if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(accountNo))
				throw new InvalidOperationException("Cấu hình VietQR chưa đầy đủ.");

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

			var response = await client.PostAsync("https://api.vietqr.io/v2/generate", content, ct);
			var responseContent = await response.Content.ReadAsStringAsync(ct);

			var root = JsonDocument.Parse(responseContent).RootElement;

			if (root.TryGetProperty("code", out var codeProp) && codeProp.GetString() == "00")
			{
				if (root.TryGetProperty("data", out var dataProp) &&
					dataProp.TryGetProperty("qrDataURL", out var qrProp))
				{
					string qrDataUrl = qrProp.GetString()!;
					string base64Data = qrDataUrl.Split(",")[1];
					byte[] qrBytes = Convert.FromBase64String(base64Data);
					return qrBytes;
				}
				else
				{
					throw new InvalidOperationException("Response không có trường data.qrDataURL.");
				}
			}
			else
			{
				var msg = root.TryGetProperty("desc", out var descProp)
					? descProp.GetString()
					: root.ToString();
				throw new InvalidOperationException($"Lỗi khi gọi VietQR API: {msg}");
			}
		}

		public async Task<object> CreatePaymentHistoryAsync(CreatePaymentHistoryRequest request, CancellationToken ct = default)
        {
            // Business logic: Validate user exists
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId, ct);
            if (user == null)
                throw new KeyNotFoundException("User không tồn tại");

            // Check if user already has active VIP
            var today = DateOnly.FromDateTime(DateTime.Today);
            var hasActiveVip = await _context.PaymentHistories.AnyAsync(
                p => p.UserId == request.UserId && p.StatusService == "active" && p.EndDate >= today, ct);
            if (hasActiveVip)
                throw new InvalidOperationException("Bạn đã có gói VIP đang hoạt động. Vui lòng đợi hết hạn trước khi mua mới.");

            // Kiểm tra giao dịch thực tế từ SePay API
            var expectedDescription = $"userId{request.UserId}months{request.DurationMonths}";
            var verifyResult = await VerifyPaymentFromSepayAsync(request.UserId, request.Amount, expectedDescription, ct);
            
            if (!verifyResult.paid)
            {
                return new
                {
                    success = false,
                    message = verifyResult.message ?? "Chưa phát hiện giao dịch thanh toán. Vui lòng chuyển khoản và thử lại sau vài giây.",
                    paid = false
                };
            }

            // Business logic: Calculate dates based on duration
            var startDate = DateOnly.FromDateTime(DateTime.Now);
            var endDate = startDate.AddMonths(request.DurationMonths);

            // Business logic: Create payment history with full info
            var paymentHistory = new PaymentHistory
            {
                UserId = request.UserId,
                StatusService = "active",
                StartDate = startDate,
                EndDate = endDate,
                Amount = request.Amount,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _paymentHistoryRepository.AddAsync(paymentHistory, ct);

            // Update UserStatusId to VIP (3 = 'Tài khoản VIP')
            user.UserStatusId = 3;
            user.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync(ct);

            return new
            {
                success = true,
                message = "Thanh toán thành công! Tài khoản VIP đã được kích hoạt.",
                paid = true,
                data = new
                {
                    historyId = paymentHistory.HistoryId,
                    userId = paymentHistory.UserId,
                    statusService = paymentHistory.StatusService,
                    startDate = paymentHistory.StartDate,
                    endDate = paymentHistory.EndDate,
                    amount = (int)paymentHistory.Amount,
                    durationMonths = request.DurationMonths,
                    userStatusId = user.UserStatusId,
                    transactionTime = verifyResult.transactionTime
                }
            };
        }

        /// <summary>
        /// Kiểm tra giao dịch thanh toán từ SePay API
        /// </summary>
        private async Task<(bool paid, string? message, string? transactionTime)> VerifyPaymentFromSepayAsync(
            int userId, decimal amount, string expectedDescription, CancellationToken ct = default)
        {
            try
            {
                var apiKey = _configuration["Sepay:ApiKey"];
                var apiUrl = _configuration["Sepay:ApiUrl"];
                var accountNo = _configuration["Sepay:AccountNumber"];
                var limit = _configuration["Sepay:Limit"] ?? "100";

                Console.WriteLine($"[SePay] Checking payment for userId={userId}, amount={amount}, expectedDesc={expectedDescription}");

                if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiUrl) || string.IsNullOrEmpty(accountNo))
                {
                    Console.WriteLine("[SePay] Config missing!");
                    throw new InvalidOperationException("Cấu hình SePay chưa đầy đủ. Vui lòng liên hệ admin.");
                }

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                // Gọi SePay API để lấy danh sách giao dịch gần đây
                var url = $"{apiUrl}?account_number={accountNo}&limit={limit}";
                Console.WriteLine($"[SePay] Calling API: {url}");
                
                var response = await client.GetAsync(url, ct);
                var responseContent = await response.Content.ReadAsStringAsync(ct);
                
                Console.WriteLine($"[SePay] Response status: {response.StatusCode}");
                Console.WriteLine($"[SePay] Response: {responseContent.Substring(0, Math.Min(500, responseContent.Length))}...");

                var root = JsonDocument.Parse(responseContent).RootElement;

                // SePay response format: {"status": 200, "messages": {...}, "transactions": [...]}
                // status có thể là Number hoặc String
                int sepayStatus = 0;
                if (root.TryGetProperty("status", out var statusProp))
                {
                    if (statusProp.ValueKind == JsonValueKind.Number)
                        sepayStatus = statusProp.GetInt32();
                    else if (statusProp.ValueKind == JsonValueKind.String)
                        int.TryParse(statusProp.GetString(), out sepayStatus);
                }
                
                if (sepayStatus == 200)
                {
                    if (root.TryGetProperty("transactions", out var transactions))
                    {
                        var transactionCount = 0;
                        // Tìm giao dịch khớp với amount và description chứa userId
                        foreach (var transaction in transactions.EnumerateArray())
                        {
                            transactionCount++;
                            decimal transAmount = 0;
                            
                            // Lấy transaction ID để kiểm tra đã sử dụng chưa
                            string transactionId = "";
                            if (transaction.TryGetProperty("id", out var idProp))
                            {
                                transactionId = idProp.ToString();
                            }
                            else if (transaction.TryGetProperty("reference_number", out var refProp))
                            {
                                transactionId = refProp.GetString() ?? "";
                            }
                            
                            // Thử lấy amount_in trước, nếu không có thì lấy amount
                            // SePay có thể trả về dạng Number hoặc String
                            if (transaction.TryGetProperty("amount_in", out var amountInProp))
                            {
                                if (amountInProp.ValueKind == JsonValueKind.Number)
                                {
                                    transAmount = amountInProp.GetDecimal();
                                }
                                else if (amountInProp.ValueKind == JsonValueKind.String)
                                {
                                    decimal.TryParse(amountInProp.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out transAmount);
                                }
                            }
                            else if (transaction.TryGetProperty("amount", out var amountProp))
                            {
                                if (amountProp.ValueKind == JsonValueKind.Number)
                                {
                                    transAmount = amountProp.GetDecimal();
                                }
                                else if (amountProp.ValueKind == JsonValueKind.String)
                                {
                                    decimal.TryParse(amountProp.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out transAmount);
                                }
                            }

                            var transDesc = "";
                            if (transaction.TryGetProperty("transaction_content", out var contentProp))
                            {
                                transDesc = contentProp.GetString() ?? "";
                            }

                            Console.WriteLine($"[SePay] Transaction #{transactionCount}: id={transactionId}, amount={transAmount}, content='{transDesc}'");

                            // Kiểm tra description chứa CHÍNH XÁC format: userIdXmonthsY (ví dụ: userId3months1)
                            // Pattern phải match chính xác userId, không được match userId3 khi tìm userId30
                            var normalizedDesc = transDesc.Replace(" ", "").ToLower();
                            
                            // Sử dụng regex để match CHÍNH XÁC format: userid{userId}months\d+
                            // Ví dụ: userid3months1, userid30months12
                            // Đảm bảo số userId không bị match nhầm (userid3 không match userid30)
                            var exactPattern = $@"userid{userId}months\d+";
                            var descMatch = System.Text.RegularExpressions.Regex.IsMatch(normalizedDesc, exactPattern);
                            
                            // Double check: đảm bảo ký tự sau userId phải là 'm' (months)
                            if (descMatch)
                            {
                                var userIdStr = userId.ToString();
                                var checkPattern = $"userid{userIdStr}m";
                                descMatch = normalizedDesc.Contains(checkPattern);
                            }

                            Console.WriteLine($"[SePay] descMatch={descMatch}, normalizedDesc='{normalizedDesc}', checking for userId={userId}");

                            // Nếu tìm thấy giao dịch có userId khớp
                            if (descMatch)
                            {
                                // Kiểm tra thời gian giao dịch - chỉ chấp nhận giao dịch trong vòng 24 giờ
                                var transTimeStr = transaction.TryGetProperty("transaction_date", out var dateProp) 
                                    ? dateProp.GetString() 
                                    : null;
                                
                                if (!string.IsNullOrEmpty(transTimeStr))
                                {
                                    if (DateTime.TryParse(transTimeStr, out var transDateTime))
                                    {
                                        var hoursSinceTransaction = (DateTime.Now - transDateTime).TotalHours;
                                        if (hoursSinceTransaction > 24)
                                        {
                                            Console.WriteLine($"[SePay] Transaction too old: {hoursSinceTransaction} hours ago");
                                            continue; // Bỏ qua giao dịch cũ, tiếp tục tìm
                                        }
                                    }
                                }

                                // QUAN TRỌNG: Kiểm tra xem user này đã có payment history với cùng amount và thời gian gần đây chưa
                                // Nếu đã có thì giao dịch này đã được sử dụng
                                if (!string.IsNullOrEmpty(transTimeStr) && DateTime.TryParse(transTimeStr, out var parsedTransTime))
                                {
                                    // Kiểm tra xem đã có payment history nào được tạo sau thời điểm giao dịch này không
                                    // Nếu có nghĩa là giao dịch này đã được xử lý
                                    var alreadyUsed = await _context.PaymentHistories
                                        .AnyAsync(p => p.UserId == userId 
                                            && p.Amount == transAmount 
                                            && p.CreatedAt >= parsedTransTime.AddMinutes(-5), ct); // Cho phép sai lệch 5 phút
                                    
                                    if (alreadyUsed)
                                    {
                                        Console.WriteLine($"[SePay] Transaction already used for userId={userId}, amount={transAmount}, time={transTimeStr}");
                                        continue; // Giao dịch đã được sử dụng, tiếp tục tìm giao dịch khác
                                    }
                                }

                                // Kiểm tra số tiền: bắt buộc phải khớp chính xác 100%
                                // So sánh sau khi làm tròn về int (VNĐ không có phần thập phân)
                                if ((int)transAmount == (int)amount)
                                {
                                    Console.WriteLine($"[SePay] FOUND matching transaction! id={transactionId}, amount={(int)transAmount}, time={transTimeStr}");
                                    return (true, "Đã xác nhận giao dịch thanh toán", transTimeStr ?? DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
                                }
                                else
                                {
                                    // Chuyển sai số tiền (thiếu hoặc thừa)
                                    Console.WriteLine($"[SePay] Found transaction but amount mismatch: expected={(int)amount}, got={(int)transAmount}");
                                    return (false, $"Số tiền chuyển khoản không đúng. Bạn đã chuyển {(int)transAmount:N0}đ nhưng số tiền cần thanh toán là {(int)amount:N0}đ. Vui lòng liên hệ hỗ trợ qua email: support@pawnder.com để được xử lý.", null);
                                }
                            }
                        }

                        Console.WriteLine($"[SePay] Checked {transactionCount} transactions, no match found for userId={userId}");
                        // Không tìm thấy giao dịch khớp
                        return (false, $"Chưa phát hiện giao dịch thanh toán. Vui lòng đảm bảo đã chuyển khoản đúng số tiền ({amount:N0}đ) và nội dung chứa 'userId{userId}'.", null);
                    }
                    else
                    {
                        Console.WriteLine("[SePay] No 'transactions' field in response");
                    }
                }
                else
                {
                    Console.WriteLine($"[SePay] API returned non-200 status or missing status field");
                }

                return (false, "Không thể kiểm tra giao dịch từ ngân hàng. Vui lòng thử lại sau.", null);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SePay] Exception: {ex.Message}");
                return (false, $"Lỗi khi kiểm tra thanh toán: {ex.Message}", null);
            }
        }

        public async Task<IEnumerable<object>> GetPaymentHistoriesByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _paymentHistoryRepository.GetPaymentHistoriesByUserIdAsync(userId, ct);
        }

        public async Task<IEnumerable<object>> GetAllPaymentHistoriesAsync(CancellationToken ct = default)
        {
            return await _paymentHistoryRepository.GetAllPaymentHistoriesAsync(ct);
        }

        public async Task<object> GetVipStatusAsync(int userId, CancellationToken ct = default)
        {
            var activeSubscription = await _paymentHistoryRepository.GetVipStatusAsync(userId, ct);

            if (activeSubscription != null)
            {
                return new
                {
                    success = true,
                    isVip = true,
                    subscription = activeSubscription
                };
            }

            return new
            {
                success = true,
                isVip = false,
                subscription = (object?)null
            };
        }

	public async Task<object> ProcessPaymentCallbackAsync(JsonElement notification, int userIdFromToken, CancellationToken ct = default)
	{
		try
		{
		// Parse thông tin từ SePay callback
		// Format từ SePay: {"transferAmount": 5000, "content": "userId1months1", "transferType": "in", ...}

			decimal amount = 0;
			string description = "";

			// Lấy amount từ transferAmount hoặc amount
			if (notification.TryGetProperty("transferAmount", out var transferAmountProp))
			{
				amount = transferAmountProp.GetDecimal();
			}
			else if (notification.TryGetProperty("amount", out var amountProp))
			{
				amount = amountProp.GetDecimal();
			}
			else
			{
				throw new InvalidOperationException("Callback thiếu thông tin amount/transferAmount");
			}

			// Lấy description từ content, transaction_content hoặc description
			if (notification.TryGetProperty("content", out var contentProp))
			{
				description = contentProp.GetString() ?? "";
			}
			else if (notification.TryGetProperty("transaction_content", out var transContentProp))
			{
				description = transContentProp.GetString() ?? "";
			}
			else if (notification.TryGetProperty("description", out var descProp))
			{
				description = descProp.GetString() ?? "";
			}
			else
			{
				throw new InvalidOperationException("Callback thiếu thông tin content/description");
			}

		// Parse description format: userIdXmonthsY (ví dụ: userId3months1)
		int userIdFromNotification;
		int durationMonths;

		var match = System.Text.RegularExpressions.Regex.Match(description, @"userId(\d+)months(\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
		if (match.Success)
		{
			userIdFromNotification = int.Parse(match.Groups[1].Value);
			durationMonths = int.Parse(match.Groups[2].Value);
		}
		else
		{
			throw new InvalidOperationException($"Format description không hợp lệ: '{description}'. Format đúng: userIdXmonthsY (ví dụ: userId3months1)");
		}

			// So sánh userId từ token với userId trong notification
			if (userIdFromToken != userIdFromNotification)
			{
				return new
				{
					success = false,
					message = $"userId không khớp. Token userId: {userIdFromToken}, Notification userId: {userIdFromNotification}"
				};
			}

			// Kiểm tra user tồn tại
			var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userIdFromNotification, ct);
			if (user == null)
				throw new KeyNotFoundException($"User {userIdFromNotification} không tồn tại");

			// Kiểm tra xem đã có payment history pending không
			var existingPayment = await _context.PaymentHistories
				.Where(p => p.UserId == userIdFromNotification && p.Amount == amount && p.StatusService == "pending")
				.OrderByDescending(p => p.CreatedAt)
				.FirstOrDefaultAsync(ct);

			if (existingPayment != null)
			{
				// Cập nhật payment history từ pending sang active
				existingPayment.StatusService = "active";
				existingPayment.UpdatedAt = DateTime.Now;
				await _context.SaveChangesAsync(ct);

				return new
				{
					success = true,
					message = "Cập nhật trạng thái thanh toán thành công",
					data = new
					{
						historyId = existingPayment.HistoryId,
						userId = existingPayment.UserId,
						statusService = existingPayment.StatusService,
						amount = (int)existingPayment.Amount
					}
				};
			}
			else
			{
				// Tạo mới payment history với status active
				var startDate = DateOnly.FromDateTime(DateTime.Now);
				var endDate = startDate.AddMonths(durationMonths);

				var paymentHistory = new PaymentHistory
				{
					UserId = userIdFromNotification,
					StatusService = "active",
					StartDate = startDate,
					EndDate = endDate,
					Amount = amount,
					CreatedAt = DateTime.Now,
					UpdatedAt = DateTime.Now
				};

				_context.PaymentHistories.Add(paymentHistory);
				await _context.SaveChangesAsync(ct);

				return new
				{
					success = true,
					message = "Tạo payment history thành công",
					data = new
					{
						historyId = paymentHistory.HistoryId,
						userId = paymentHistory.UserId,
						statusService = paymentHistory.StatusService,
						startDate = paymentHistory.StartDate,
						endDate = paymentHistory.EndDate,
						amount = (int)paymentHistory.Amount
					}
				};
			}
			}
			catch (Exception ex)
			{
				// Log error (có thể thêm ILogger nếu cần)
				throw new InvalidOperationException($"Lỗi xử lý callback: {ex.Message}", ex);
			}
		}

		public Task<bool> ValidateWebhookAsync(string? authHeader, CancellationToken ct = default)
		{
			try
			{
				var webhookApiKey = _configuration["Sepay:WebhookApiKey"];

				if (string.IsNullOrEmpty(webhookApiKey))
				{
					// Nếu không config WebhookApiKey thì cho phép tất cả (development mode)
					return Task.FromResult(true);
				}

				if (string.IsNullOrEmpty(authHeader))
				{
					return Task.FromResult(false);
				}

				// SePay gửi Authorization header dạng: "Apikey <API_KEY>" hoặc "Bearer <API_KEY>"
				var token = authHeader
					.Replace("Apikey ", "", StringComparison.OrdinalIgnoreCase)
					.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)
					.Trim();

				// So sánh token với WebhookApiKey
				return Task.FromResult(token == webhookApiKey);
			}
			catch
			{
				return Task.FromResult(false);
			}
		}

	/// <summary>
	/// Kiểm tra thanh toán trong 30 phút gần đây từ SePay
	/// </summary>
	public async Task<object> CheckPaymentInLastHourAsync(
			int userId, 
			decimal transferAmount, 
			string content, 
			CancellationToken ct = default)
		{
			try
			{
			var apiKey = _configuration["Sepay:ApiKey"];
			var apiUrl = _configuration["Sepay:ApiUrl"];
			var accountNo = _configuration["Sepay:AccountNumber"];
			// Không dùng limit - lấy tất cả giao dịch

			Console.WriteLine($"[CheckPaymentInLastHour] userId={userId}, amount={transferAmount}, content={content}");

			if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiUrl) || string.IsNullOrEmpty(accountNo))
			{
				Console.WriteLine("[CheckPaymentInLastHour] Config missing!");
				return new
				{
					success = false,
					paid = false,
					message = "Cấu hình SePay chưa đầy đủ. Vui lòng liên hệ admin."
				};
			}

			var client = _httpClientFactory.CreateClient();
			client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

			// Gọi SePay API để lấy TẤT CẢ giao dịch (không dùng limit)
			var url = $"{apiUrl}?account_number={accountNo}";
			Console.WriteLine($"[CheckPaymentInLastHour] Calling API: {url} (no limit)");
				
			var response = await client.GetAsync(url, ct);
			var responseContent = await response.Content.ReadAsStringAsync(ct);
			
			Console.WriteLine($"[CheckPaymentInLastHour] Response status: {response.StatusCode}");
			Console.WriteLine($"[CheckPaymentInLastHour] Full response (first 2000 chars): {responseContent.Substring(0, Math.Min(2000, responseContent.Length))}");

			var root = JsonDocument.Parse(responseContent).RootElement;

				// Parse status
				int sepayStatus = 0;
				if (root.TryGetProperty("status", out var statusProp))
				{
					if (statusProp.ValueKind == JsonValueKind.Number)
						sepayStatus = statusProp.GetInt32();
					else if (statusProp.ValueKind == JsonValueKind.String)
						int.TryParse(statusProp.GetString(), out sepayStatus);
				}
				
				if (sepayStatus == 200)
				{
		if (root.TryGetProperty("transactions", out var transactions))
		{
			var thirtyMinutesAgo = DateTime.Now.AddMinutes(-30); // Kiểm tra giao dịch trong 30 phút gần đây
			var transactionCount = 0;

			// Biến để lưu thông tin giao dịch khớp
			decimal? matchedTransAmount = null;
			string? matchedTransDesc = null;
			string? matchedTransTimeStr = null;
			DateTime? matchedTransDateTime = null;

			// Duyệt qua các giao dịch để tìm giao dịch khớp
			foreach (var transaction in transactions.EnumerateArray())
			{
				transactionCount++;
				
				// Parse amount - hỗ trợ cả snake_case và camelCase
				decimal transAmount = 0;
				string rawAmountValue = "";
				
				if (transaction.TryGetProperty("transferAmount", out var transferAmountProp))
				{
					rawAmountValue = transferAmountProp.ToString();
					Console.WriteLine($"[DEBUG] Raw transferAmount from SePay: '{rawAmountValue}' (ValueKind: {transferAmountProp.ValueKind})");
					
					if (transferAmountProp.ValueKind == JsonValueKind.Number)
						transAmount = transferAmountProp.GetDecimal();
					else if (transferAmountProp.ValueKind == JsonValueKind.String)
						decimal.TryParse(transferAmountProp.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out transAmount);
				}
				else if (transaction.TryGetProperty("amount_in", out var amountInProp))
				{
					rawAmountValue = amountInProp.ToString();
					Console.WriteLine($"[DEBUG] Raw amount_in from SePay: '{rawAmountValue}' (ValueKind: {amountInProp.ValueKind})");
					
					if (amountInProp.ValueKind == JsonValueKind.Number)
						transAmount = amountInProp.GetDecimal();
					else if (amountInProp.ValueKind == JsonValueKind.String)
						decimal.TryParse(amountInProp.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out transAmount);
				}
				else if (transaction.TryGetProperty("amount", out var amountProp))
				{
					rawAmountValue = amountProp.ToString();
					Console.WriteLine($"[DEBUG] Raw amount from SePay: '{rawAmountValue}' (ValueKind: {amountProp.ValueKind})");
					
					if (amountProp.ValueKind == JsonValueKind.Number)
						transAmount = amountProp.GetDecimal();
					else if (amountProp.ValueKind == JsonValueKind.String)
						decimal.TryParse(amountProp.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out transAmount);
				}
				
				Console.WriteLine($"[DEBUG] Parsed transAmount: {transAmount:F2} ({(int)transAmount}), Expected transferAmount: {transferAmount:F2} ({(int)transferAmount})");

				// Parse transaction content - hỗ trợ cả snake_case và camelCase
				var transDesc = "";
				if (transaction.TryGetProperty("content", out var contentProp))
					transDesc = contentProp.GetString() ?? "";
				else if (transaction.TryGetProperty("transaction_content", out var transContentProp))
					transDesc = transContentProp.GetString() ?? "";

				// Parse transaction date - hỗ trợ cả snake_case và camelCase
				var transTimeStr = "";
				if (transaction.TryGetProperty("transactionDate", out var transDateProp))
					transTimeStr = transDateProp.GetString() ?? "";
				else if (transaction.TryGetProperty("transaction_date", out var dateProp))
					transTimeStr = dateProp.GetString() ?? "";

				Console.WriteLine($"[CheckPaymentInLastHour] Transaction #{transactionCount}: amount={(int)transAmount}, content='{transDesc}', time={transTimeStr}");

				// Kiểm tra thời gian giao dịch - chỉ lấy giao dịch trong khoảng thời gian gần đây
				if (!string.IsNullOrEmpty(transTimeStr))
				{
					if (DateTime.TryParse(transTimeStr, out var transDateTime))
					{
						var hoursSinceTransaction = (DateTime.Now - transDateTime).TotalHours;
						Console.WriteLine($"[CheckPaymentInLastHour] Transaction time: {transDateTime}, Current: {DateTime.Now}, Hours ago: {hoursSinceTransaction:F2}");
						
						if (transDateTime < thirtyMinutesAgo)
						{
							Console.WriteLine($"[CheckPaymentInLastHour] ❌ Transaction too old: {transDateTime} < {thirtyMinutesAgo} (more than 30 minutes ago)");
							continue; // Bỏ qua giao dịch cũ
						}

						// Kiểm tra xem giao dịch này đã được sử dụng chưa
						var alreadyUsed = await _context.PaymentHistories
							.AnyAsync(p => p.UserId == userId 
								&& p.Amount == transAmount 
								&& p.CreatedAt >= transDateTime.AddMinutes(-5), ct);
						
						if (alreadyUsed)
						{
							Console.WriteLine($"[CheckPaymentInLastHour] Transaction already used");
							continue;
						}

						// Normalize content để so sánh (bỏ khoảng trắng, lowercase)
						var normalizedTransDesc = transDesc.Replace(" ", "").ToLower();
						var normalizedContent = content.Replace(" ", "").ToLower();

						Console.WriteLine($"[CheckPaymentInLastHour] Comparing: amount={(int)transAmount} vs {(int)transferAmount}, content contains? {normalizedTransDesc.Contains(normalizedContent)}");

						// Kiểm tra: Amount khớp VÀ Content chứa chuỗi yêu cầu
						// So sánh sau khi làm tròn về int (VNĐ không có phần thập phân)
						if ((int)transAmount == (int)transferAmount && normalizedTransDesc.Contains(normalizedContent))
						{
							Console.WriteLine($"[CheckPaymentInLastHour] ✅ FOUND matching transaction!");
							
							// Lưu thông tin giao dịch khớp và dừng vòng for
							matchedTransAmount = transAmount;
							matchedTransDesc = transDesc;
							matchedTransTimeStr = transTimeStr;
							matchedTransDateTime = transDateTime;
							break; // Dừng vòng for khi tìm thấy giao dịch khớp
						}
					}
				}
			}

			// Sau khi dừng vòng for, kiểm tra nếu có giao dịch khớp thì thực hiện logic lưu PaymentHistory
			if (matchedTransAmount.HasValue && matchedTransDateTime.HasValue)
			{
				Console.WriteLine($"[CheckPaymentInLastHour] Processing matched transaction: amount={matchedTransAmount}, content={matchedTransDesc}");
				
				// Parse userId và durationMonths từ content của giao dịch
				int userIdFromTransaction = 0;
				int durationMonths = 0;
				var match = System.Text.RegularExpressions.Regex.Match(matchedTransDesc ?? "", @"userId(\d+)months(\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
				if (match.Success)
				{
					userIdFromTransaction = int.Parse(match.Groups[1].Value);
					durationMonths = int.Parse(match.Groups[2].Value);
				}
				else
				{
					// Nếu không parse được từ transDesc, dùng userId và content từ parameter
					userIdFromTransaction = userId;
					match = System.Text.RegularExpressions.Regex.Match(content, @"userId(\d+)months(\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
					if (match.Success)
					{
						durationMonths = int.Parse(match.Groups[2].Value);
					}
					else
					{
						Console.WriteLine($"[CheckPaymentInLastHour] ⚠️ Cannot parse durationMonths from content: '{content}'");
						// Mặc định 1 tháng nếu không parse được
						durationMonths = 1;
					}
				}

				// Kiểm tra userId từ transaction có khớp với userId từ token không
				if (userIdFromTransaction != userId)
				{
					Console.WriteLine($"[CheckPaymentInLastHour] ⚠️ userId mismatch: transaction={userIdFromTransaction}, token={userId}");
					return new
					{
						success = false,
						paid = false,
						message = $"userId không khớp. Transaction userId: {userIdFromTransaction}, Token userId: {userId}"
					};
				}

				// Kiểm tra user tồn tại
				var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
				if (user == null)
				{
					Console.WriteLine($"[CheckPaymentInLastHour] ⚠️ User {userId} not found");
					return new
					{
						success = false,
						paid = false,
						message = $"User {userId} không tồn tại"
					};
				}

				// Kiểm tra user chưa có VIP active
				var today = DateOnly.FromDateTime(DateTime.Today);
				var hasActiveVip = await _context.PaymentHistories.AnyAsync(
					p => p.UserId == userId && p.StatusService == "active" && p.EndDate >= today, ct);
				if (hasActiveVip)
				{
					Console.WriteLine($"[CheckPaymentInLastHour] ⚠️ User {userId} already has active VIP");
					return new
					{
						success = false,
						paid = false,
						message = "Bạn đã có gói VIP đang hoạt động. Vui lòng đợi hết hạn trước khi mua mới."
					};
				}

				// Kiểm tra xem đã có payment history pending không (theo logic ProcessPaymentCallbackAsync)
				var existingPayment = await _context.PaymentHistories
					.Where(p => p.UserId == userId && p.Amount == matchedTransAmount.Value && p.StatusService == "pending")
					.OrderByDescending(p => p.CreatedAt)
					.FirstOrDefaultAsync(ct);

				if (existingPayment != null)
				{
					// Cập nhật payment history từ pending sang active
					existingPayment.StatusService = "active";
					existingPayment.UpdatedAt = DateTime.Now;
					
					// Update UserStatusId to VIP (3 = 'Tài khoản VIP')
					user.UserStatusId = 3;
					user.UpdatedAt = DateTime.Now;
					await _context.SaveChangesAsync(ct);

					Console.WriteLine($"[CheckPaymentInLastHour] ✅ PaymentHistory updated: HistoryId={existingPayment.HistoryId}, UserId={userId}, Status: pending -> active");
					
					// Trả về thông tin giao dịch đã cập nhật
					return new
					{
						success = true,
						paid = true,
						message = "Cập nhật trạng thái thanh toán thành công! Tài khoản VIP đã được kích hoạt.",
						data = new
						{
							historyId = existingPayment.HistoryId,
							userId = existingPayment.UserId,
							statusService = existingPayment.StatusService,
							startDate = existingPayment.StartDate,
							endDate = existingPayment.EndDate,
							amount = (int)existingPayment.Amount,
							durationMonths = durationMonths,
							userStatusId = user.UserStatusId,
							transactionTime = matchedTransTimeStr
						}
					};
				}
				else
				{
					// Tạo mới payment history với status active
					var startDate = DateOnly.FromDateTime(DateTime.Now);
					var endDate = startDate.AddMonths(durationMonths);

					var paymentHistory = new PaymentHistory
					{
						UserId = userId,
						StatusService = "active",
						StartDate = startDate,
						EndDate = endDate,
						Amount = matchedTransAmount.Value,
						CreatedAt = DateTime.Now,
						UpdatedAt = DateTime.Now
					};

					_context.PaymentHistories.Add(paymentHistory);

					// Update UserStatusId to VIP (3 = 'Tài khoản VIP')
					user.UserStatusId = 3;
					user.UpdatedAt = DateTime.Now;
					await _context.SaveChangesAsync(ct);

					Console.WriteLine($"[CheckPaymentInLastHour] ✅ PaymentHistory created: HistoryId={paymentHistory.HistoryId}, UserId={userId}, Amount={matchedTransAmount}, Duration={durationMonths} months");
					
					// Trả về thông tin giao dịch đã lưu
					return new
					{
						success = true,
						paid = true,
						message = "Thanh toán thành công! Tài khoản VIP đã được kích hoạt.",
						data = new
						{
							historyId = paymentHistory.HistoryId,
							userId = paymentHistory.UserId,
							statusService = paymentHistory.StatusService,
							startDate = paymentHistory.StartDate,
							endDate = paymentHistory.EndDate,
							amount = (int)paymentHistory.Amount,
							durationMonths = durationMonths,
							userStatusId = user.UserStatusId,
							transactionTime = matchedTransTimeStr
						}
					};
				}
			}

	Console.WriteLine($"[CheckPaymentInLastHour] Checked {transactionCount} transactions, no match found");
	return new
	{
		success = false,
		paid = false,
		message = $"Chưa phát hiện giao dịch trong 30 phút gần đây với số tiền {transferAmount:N0}đ và nội dung chứa '{content}'."
	};
	}
	else
	{
		Console.WriteLine("[CheckPaymentInLastHour] No 'transactions' field in response");
	}
}
else
{
	Console.WriteLine($"[CheckPaymentInLastHour] API returned non-200 status");
}

				return new
				{
					success = false,
					paid = false,
					message = "Không thể kiểm tra giao dịch từ ngân hàng. Vui lòng thử lại sau."
				};
			}
			catch (Exception ex)
			{
				Console.WriteLine($"[CheckPaymentInLastHour] Exception: {ex.Message}");
				return new
				{
					success = false,
					paid = false,
					message = $"Lỗi khi kiểm tra thanh toán: {ex.Message}"
				};
			}
		}

    }
}




