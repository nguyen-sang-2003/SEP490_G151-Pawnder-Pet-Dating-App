using BE.Services.Interfaces;

namespace BE.Services;

/// <summary>
/// Background Service để tự động xử lý các cuộc hẹn quá hạn
/// - NO_SHOW: confirmed nhưng thiếu check-in sau 90 phút
/// - AUTO_COMPLETE: on_going sau 90 phút
/// </summary>
public class AppointmentExpirationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AppointmentExpirationBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Kiểm tra mỗi 5 phút

    public AppointmentExpirationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<AppointmentExpirationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AppointmentExpirationBackgroundService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredAppointmentsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing expired appointments");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("AppointmentExpirationBackgroundService stopped");
    }

    private async Task ProcessExpiredAppointmentsAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var appointmentService = scope.ServiceProvider.GetRequiredService<IAppointmentService>();

        await appointmentService.ProcessExpiredAppointmentsAsync(ct);
        
        _logger.LogDebug("Processed expired appointments at {Time}", DateTime.Now);
    }
}
