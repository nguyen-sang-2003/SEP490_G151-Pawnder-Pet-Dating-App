using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface INotificationRepository : IBaseRepository<Notification>
    {
        Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync(CancellationToken ct = default);
        Task<NotificationDto?> GetNotificationByIdAsync(int notificationId, CancellationToken ct = default);
        Task<IEnumerable<Notification>> GetNotificationsByUserIdAsync(int userId, CancellationToken ct = default);
        Task<int> MarkAllAsReadAsync(int userId, CancellationToken ct = default);
        Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
    }
}




