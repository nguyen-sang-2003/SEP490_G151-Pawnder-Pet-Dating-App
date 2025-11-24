using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;

namespace BE.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        public async Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync(CancellationToken ct = default)
        {
            return await _notificationRepository.GetAllNotificationsAsync(ct);
        }

        public async Task<NotificationDto?> GetNotificationByIdAsync(int notificationId, CancellationToken ct = default)
        {
            return await _notificationRepository.GetNotificationByIdAsync(notificationId, ct);
        }

        public async Task<IEnumerable<Notification>> GetNotificationsByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _notificationRepository.GetNotificationsByUserIdAsync(userId, ct);
        }

        public async Task<Notification> CreateNotificationAsync(NotificationDto_1 notificationDto, CancellationToken ct = default)
        {
            if (notificationDto == null)
                throw new ArgumentNullException(nameof(notificationDto), "Thông báo không hợp lệ");

            var notification = new Notification
            {
                UserId = notificationDto.UserId,
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _notificationRepository.AddAsync(notification, ct);
            return notification;
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId, CancellationToken ct = default)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId, ct);
            if (notification == null)
                return false;

            await _notificationRepository.DeleteAsync(notification, ct);
            return true;
        }
    }
}




