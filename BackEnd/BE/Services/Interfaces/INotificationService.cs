using BE.DTO;
using BE.Models;

namespace BE.Services.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync(CancellationToken ct = default);
        Task<NotificationDto?> GetNotificationByIdAsync(int notificationId, CancellationToken ct = default);
        Task<IEnumerable<Notification>> GetNotificationsByUserIdAsync(int userId, CancellationToken ct = default);
        Task<Notification> CreateNotificationAsync(NotificationDto_1 notificationDto, CancellationToken ct = default);
        Task<bool> MarkAsReadAsync(int notificationId, CancellationToken ct = default);
        Task<int> MarkAllAsReadAsync(int userId, CancellationToken ct = default);
        Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
        Task<bool> DeleteNotificationAsync(int notificationId, CancellationToken ct = default);

        // Broadcast notification methods (Admin)
        Task<Notification> CreateBroadcastDraftAsync(string title, string message, int adminUserId, string? type = null, CancellationToken ct = default);
        Task<Notification?> UpdateBroadcastDraftAsync(int notificationId, string title, string message, string? type = null, CancellationToken ct = default);
        Task<bool> DeleteBroadcastDraftAsync(int notificationId, CancellationToken ct = default);
        Task<int> SendBroadcastAsync(int notificationId, CancellationToken ct = default);
        Task<IEnumerable<Notification>> GetBroadcastDraftsAsync(CancellationToken ct = default);
        Task<IEnumerable<Notification>> GetSentBroadcastsAsync(CancellationToken ct = default);
    }
}
