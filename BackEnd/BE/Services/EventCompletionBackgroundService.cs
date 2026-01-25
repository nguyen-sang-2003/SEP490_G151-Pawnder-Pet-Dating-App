using BE.Services.Interfaces;

namespace BE.Services;

/// <summary>
/// Background service để tự động chuyển trạng thái events
/// Chạy mỗi phút để kiểm tra:
/// - upcoming -> active (khi StartTime đến)
/// - active -> submission_closed (khi SubmissionDeadline qua)
/// - submission_closed -> voting_ended (khi EndTime qua) + tính kết quả
/// </summary>
public class EventCompletionBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EventCompletionBackgroundService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(15);

    public EventCompletionBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<EventCompletionBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EventCompletionBackgroundService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessEventsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing event transitions");
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("EventCompletionBackgroundService stopped");
    }

    private async Task ProcessEventsAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var eventService = scope.ServiceProvider.GetRequiredService<IEventService>();

        await eventService.ProcessEventTransitionsAsync(ct);
    }
}
