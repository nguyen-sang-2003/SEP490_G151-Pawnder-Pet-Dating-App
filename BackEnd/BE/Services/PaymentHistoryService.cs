using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
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
            // Parse userId from addInfo
            int userId = 0;
            var parts = addInfo.Split('_');
            if (parts.Length >= 4 && parts[0] == "userId" && parts[2] == "months")
            {
                int.TryParse(parts[1], out userId);
            }
            else
            {
                var match = System.Text.RegularExpressions.Regex.Match(addInfo, @"userId(\d+)months(\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    int.TryParse(match.Groups[1].Value, out userId);
                }
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

            // Business logic: Calculate dates based on duration
            var startDate = DateOnly.FromDateTime(DateTime.Now);
            var endDate = startDate.AddMonths(request.DurationMonths);

            // Business logic: Create payment history
            var paymentHistory = new PaymentHistory
            {
                UserId = request.UserId,
                StatusService = "active",
                StartDate = startDate,
                EndDate = endDate,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _paymentHistoryRepository.AddAsync(paymentHistory, ct);

            return new
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
            };
        }

        public async Task<IEnumerable<object>> GetPaymentHistoriesByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _paymentHistoryRepository.GetPaymentHistoriesByUserIdAsync(userId, ct);
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

        public async Task<object> ProcessPaymentCallbackAsync(JsonElement notification, CancellationToken ct = default)
        {
            try
            {
                // Parse thông tin từ SePay callback
                // Format từ SePay: {"transferAmount": 5000, "content": "userId_1_months_1", "transferType": "in", ...}
                
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

                // Parse description format: hỗ trợ cả "userId_{userId}_months_{months}" và "userId{userId}months{months}"
                int userId;
                int durationMonths;

                // Thử parse với dấu gạch dưới trước
                var parts = description.Split('_');
                if (parts.Length >= 4 && parts[0] == "userId" && parts[2] == "months")
                {
                    userId = int.Parse(parts[1]);
                    durationMonths = int.Parse(parts[3]);
                }
                else
                {
                    // Thử parse không có dấu gạch dưới: "userId3months1"
                    var match = System.Text.RegularExpressions.Regex.Match(description, @"userId(\d+)months(\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (match.Success)
                    {
                        userId = int.Parse(match.Groups[1].Value);
                        durationMonths = int.Parse(match.Groups[2].Value);
                    }
                    else
                    {
                        throw new InvalidOperationException("Format description không hợp lệ. Expected: userId_{userId}_months_{months} hoặc userId{userId}months{months}");
                    }
                }

                // Kiểm tra user tồn tại
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
                if (user == null)
                    throw new KeyNotFoundException($"User {userId} không tồn tại");

                // Kiểm tra xem đã có payment history pending không
                var existingPayment = await _context.PaymentHistories
                    .Where(p => p.UserId == userId && p.Amount == amount && p.StatusService == "pending")
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
                            amount = existingPayment.Amount
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
                            amount = paymentHistory.Amount
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

        public async Task<object> CheckPaymentStatusAsync(int userId, decimal amount, string description, CancellationToken ct = default)
        {
            try
            {
                var apiKey = _configuration["Sepay:ApiKey"];
                var apiUrl = _configuration["Sepay:ApiUrl"];
                var accountNo = _configuration["Sepay:AccountNumber"];
                var limit = _configuration["Sepay:Limit"] ?? "20";

                if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(accountNo))
                    throw new InvalidOperationException("Cấu hình SePay chưa đầy đủ.");

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                // Gọi SePay API để lấy danh sách giao dịch
                var url = $"{apiUrl}?account_number={accountNo}&limit={limit}";
                var response = await client.GetAsync(url, ct);
                var responseContent = await response.Content.ReadAsStringAsync(ct);

                var root = JsonDocument.Parse(responseContent).RootElement;

                // SePay response format: {"status": 200, "messages": {...}, "transactions": [...]}
                if (root.TryGetProperty("status", out var statusProp) && statusProp.GetInt32() == 200)
                {
                    if (root.TryGetProperty("transactions", out var transactions))
                    {
                        // Tìm giao dịch khớp với amount và description
                        foreach (var transaction in transactions.EnumerateArray())
                        {
                            var transAmount = transaction.GetProperty("amount_in").GetDecimal();
                            var transDesc = transaction.GetProperty("transaction_content").GetString() ?? "";

                            if (transAmount == amount && transDesc.Contains(description))
                            {
                                // Tìm thấy giao dịch khớp - Cập nhật status
                                var existingPayment = await _context.PaymentHistories
                                    .Where(p => p.UserId == userId && p.Amount == amount && p.StatusService == "pending")
                                    .OrderByDescending(p => p.CreatedAt)
                                    .FirstOrDefaultAsync(ct);

                                if (existingPayment != null)
                                {
                                    existingPayment.StatusService = "active";
                                    existingPayment.UpdatedAt = DateTime.Now;
                                    await _context.SaveChangesAsync(ct);

                                    return new
                                    {
                                        success = true,
                                        paid = true,
                                        message = "Thanh toán thành công! Tài khoản VIP đã được kích hoạt.",
                                        data = new
                                        {
                                            historyId = existingPayment.HistoryId,
                                            statusService = existingPayment.StatusService,
                                            transactionTime = transaction.GetProperty("transaction_date").GetString()
                                        }
                                    };
                                }
                                else
                                {
                                    return new
                                    {
                                        success = true,
                                        paid = true,
                                        message = "Đã tìm thấy giao dịch nhưng chưa có payment history pending.",
                                        needCreateHistory = true
                                    };
                                }
                            }
                        }

                        // Không tìm thấy giao dịch khớp
                        return new
                        {
                            success = true,
                            paid = false,
                            message = "Chưa phát hiện giao dịch thanh toán."
                        };
                    }
                }

                return new
                {
                    success = false,
                    paid = false,
                    message = "Lỗi khi kiểm tra giao dịch với SePay"
                };
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Lỗi khi kiểm tra payment status: {ex.Message}", ex);
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

        public async Task<object> UpdateExpiredPaymentsAsync(CancellationToken ct = default)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);

            // Tìm tất cả payment history có EndDate < today và StatusService = "active"
            var expiredPayments = await _context.PaymentHistories
                .Where(p => p.EndDate < today && p.StatusService == "active")
                .ToListAsync(ct);

            if (!expiredPayments.Any())
            {
                return new
                {
                    success = true,
                    message = "Không có payment nào hết hạn",
                    updatedCount = 0
                };
            }

            // Update tất cả về pending
            foreach (var payment in expiredPayments)
            {
                payment.StatusService = "pending";
                payment.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync(ct);

            return new
            {
                success = true,
                message = $"Đã update {expiredPayments.Count} payment về trạng thái 'pending'",
                updatedCount = expiredPayments.Count,
                payments = expiredPayments.Select(p => new
                {
                    historyId = p.HistoryId,
                    userId = p.UserId,
                    endDate = p.EndDate,
                    statusService = p.StatusService
                })
            };
        }
    }
}




