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
    }
}




