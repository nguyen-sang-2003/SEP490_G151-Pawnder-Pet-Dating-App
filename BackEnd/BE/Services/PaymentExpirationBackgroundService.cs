using BE.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BE.Services
{
    /// <summary>
    /// Background Service tự động kiểm tra và update StatusService về "pending" 
    /// khi EndDate đã quá hạn
    /// </summary>
    public class PaymentExpirationBackgroundService : BackgroundService
    {
        private readonly ILogger<PaymentExpirationBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Check mỗi 1 giờ

        public PaymentExpirationBackgroundService(
            ILogger<PaymentExpirationBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Payment Expiration Background Service đã bắt đầu.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndUpdateExpiredPaymentsAsync(stoppingToken);
                    
                    // Đợi 1 giờ trước khi check lại
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi kiểm tra payment expiration");
                    
                    // Đợi 5 phút trước khi retry nếu có lỗi
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
            }

            _logger.LogInformation("Payment Expiration Background Service đã dừng.");
        }

        private async Task CheckAndUpdateExpiredPaymentsAsync(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<PawnderDatabaseContext>();

            var today = DateOnly.FromDateTime(DateTime.Today);

            // Tìm tất cả payment history có EndDate < today và StatusService = "active"
            var expiredPayments = await context.PaymentHistories
                .Where(p => p.EndDate < today && p.StatusService == "active")
                .ToListAsync(ct);

            if (expiredPayments.Any())
            {
                _logger.LogInformation($"Tìm thấy {expiredPayments.Count} payment đã hết hạn. Đang update...");

                foreach (var payment in expiredPayments)
                {
                    payment.StatusService = "pending";
                    payment.UpdatedAt = DateTime.Now;
                }

                await context.SaveChangesAsync(ct);

                _logger.LogInformation($"Đã update {expiredPayments.Count} payment về trạng thái 'pending'.");
            }
            else
            {
                _logger.LogDebug("Không có payment nào hết hạn.");
            }
        }
    }
}
