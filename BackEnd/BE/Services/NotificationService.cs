using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly PawnderDatabaseContext _context;

        public NotificationService(INotificationRepository notificationRepository, PawnderDatabaseContext context)
        {
            _notificationRepository = notificationRepository;
            _context = context;
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

            if (!notificationDto.UserId.HasValue || notificationDto.UserId.Value <= 0)
                throw new ArgumentException("UserId không hợp lệ", nameof(notificationDto));

            if (string.IsNullOrWhiteSpace(notificationDto.Title))
                throw new ArgumentException("Title không được để trống", nameof(notificationDto));

            if (string.IsNullOrWhiteSpace(notificationDto.Message))
                throw new ArgumentException("Message không được để trống", nameof(notificationDto));

            // Validate UserId exists in database
            // Use EF-translatable expression instead of GetValueOrDefault()
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == notificationDto.UserId.Value && (u.IsDeleted == null || u.IsDeleted == false), ct);
            
            if (!userExists)
                throw new ArgumentException($"User với UserId {notificationDto.UserId.Value} không tồn tại hoặc đã bị xóa", nameof(notificationDto));

            var notification = new Notification
            {
                UserId = notificationDto.UserId.Value,
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                Type = "expert_confirmation", // Set type for expert confirmation notifications
                IsRead = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _notificationRepository.AddAsync(notification, ct);
            return notification;
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, CancellationToken ct = default)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId, ct);
            if (notification == null)
                return false;

            notification.IsRead = true;
            notification.UpdatedAt = DateTime.Now;
            await _notificationRepository.UpdateAsync(notification, ct);
            return true;
        }

        public async Task<int> MarkAllAsReadAsync(int userId, CancellationToken ct = default)
        {
            return await _notificationRepository.MarkAllAsReadAsync(userId, ct);
        }

        public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
        {
            return await _notificationRepository.GetUnreadCountAsync(userId, ct);
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




