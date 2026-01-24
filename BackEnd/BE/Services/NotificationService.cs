using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace BE.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public NotificationService(
            INotificationRepository notificationRepository, 
            PawnderDatabaseContext context,
            IHubContext<ChatHub> hubContext)
        {
            _notificationRepository = notificationRepository;
            _context = context;
            _hubContext = hubContext;
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

            // Use Vietnam timezone (UTC+7) for consistency with existing data
            var vietnamNow = GetVietnamTime();
            
            var notification = new Notification
            {
                UserId = notificationDto.UserId.Value,
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                Type = notificationDto.Type ?? "expert_confirmation", // Allow custom type, default expert_confirmation
                IsRead = false,
                CreatedAt = vietnamNow,
                UpdatedAt = vietnamNow
            };

            await _notificationRepository.AddAsync(notification, ct);
            
            // 🔔 Send realtime notification via SignalR
            try
            {
                Console.WriteLine($"🔔 [NotificationService] Sending realtime notification to user {notification.UserId}");
                await ChatHub.SendNotification(
                    _hubContext,
                    notification.UserId.Value,
                    notification.Title,
                    notification.Message,
                    notification.Type ?? "system"
                );
                Console.WriteLine($"✅ [NotificationService] Realtime notification sent successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [NotificationService] Failed to send realtime notification: {ex.Message}");
                // Don't throw - notification is already saved to DB
            }
            
            return notification;
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, CancellationToken ct = default)
        {
            var notification = await _notificationRepository.GetByIdAsync(notificationId, ct);
            if (notification == null)
                return false;

            notification.IsRead = true;
            // Use Vietnam timezone (UTC+7) for consistency
            notification.UpdatedAt = GetVietnamTime();
            await _notificationRepository.UpdateAsync(notification, ct);
            return true;
        }

        /// <summary>
        /// Get current time in Vietnam timezone (UTC+7)
        /// Works on both Windows and Linux
        /// </summary>
        private static DateTime GetVietnamTime()
        {
            try
            {
                // Try Windows timezone ID first
                var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
            }
            catch (TimeZoneNotFoundException)
            {
                try
                {
                    // Try Linux/IANA timezone ID
                    var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                    return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
                }
                catch (TimeZoneNotFoundException)
                {
                    // Fallback: manually add 7 hours to UTC
                    return DateTime.UtcNow.AddHours(7);
                }
            }
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

        #region Broadcast Notification Methods (Admin)

        /// <summary>
        /// Create a draft broadcast notification
        /// </summary>
        public async Task<Notification> CreateBroadcastDraftAsync(string title, string message, int adminUserId, string? type = null, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Title không được để trống", nameof(title));

            if (string.IsNullOrWhiteSpace(message))
                throw new ArgumentException("Message không được để trống", nameof(message));

            var vietnamNow = GetVietnamTime();

            var notification = new Notification
            {
                UserId = null, // Broadcast không có UserId cụ thể
                Title = title,
                Message = message,
                Type = type ?? "admin_broadcast",
                Status = "DRAFT",
                IsBroadcast = true,
                IsRead = false,
                CreatedByUserId = adminUserId,
                CreatedAt = vietnamNow,
                UpdatedAt = vietnamNow
            };

            await _context.Notifications.AddAsync(notification, ct);
            await _context.SaveChangesAsync(ct);

            Console.WriteLine($"✅ [NotificationService] Created broadcast draft #{notification.NotificationId}");
            return notification;
        }

        /// <summary>
        /// Update a draft broadcast notification
        /// </summary>
        public async Task<Notification?> UpdateBroadcastDraftAsync(int notificationId, string title, string message, string? type = null, CancellationToken ct = default)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.Status == "DRAFT" && n.IsBroadcast, ct);

            if (notification == null)
                return null;

            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Title không được để trống", nameof(title));

            if (string.IsNullOrWhiteSpace(message))
                throw new ArgumentException("Message không được để trống", nameof(message));

            notification.Title = title;
            notification.Message = message;
            if (type != null) notification.Type = type;
            notification.UpdatedAt = GetVietnamTime();

            await _context.SaveChangesAsync(ct);

            Console.WriteLine($"✅ [NotificationService] Updated broadcast draft #{notificationId}");
            return notification;
        }

        /// <summary>
        /// Delete a draft broadcast notification
        /// </summary>
        public async Task<bool> DeleteBroadcastDraftAsync(int notificationId, CancellationToken ct = default)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.Status == "DRAFT" && n.IsBroadcast, ct);

            if (notification == null)
                return false;

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync(ct);

            Console.WriteLine($"✅ [NotificationService] Deleted broadcast draft #{notificationId}");
            return true;
        }

        /// <summary>
        /// Send a broadcast notification to all active users
        /// </summary>
        public async Task<int> SendBroadcastAsync(int notificationId, CancellationToken ct = default)
        {
            var draft = await _context.Notifications
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.Status == "DRAFT" && n.IsBroadcast, ct);

            if (draft == null)
                throw new ArgumentException("Không tìm thấy bản nháp thông báo hoặc đã được gửi", nameof(notificationId));

            // Get all active users with role "User" or "Expert" (RoleId = 2 or 3)
            var activeUserIds = await _context.Users
                .Where(u => (u.IsDeleted == null || u.IsDeleted == false) && (u.RoleId == 2 || u.RoleId == 3))
                .Select(u => u.UserId)
                .ToListAsync(ct);

            if (activeUserIds.Count == 0)
                return 0;

            var vietnamNow = GetVietnamTime();

            // Update draft to SENT
            draft.Status = "SENT";
            draft.SentAt = vietnamNow;
            draft.UpdatedAt = vietnamNow;

            // Create notification for each user
            var notifications = activeUserIds.Select(userId => new Notification
            {
                UserId = userId,
                Title = draft.Title,
                Message = draft.Message,
                Type = draft.Type,
                Status = "SENT",
                IsBroadcast = true,
                IsRead = false,
                ReferenceId = draft.NotificationId, // Reference to original broadcast
                SentAt = vietnamNow,
                CreatedByUserId = draft.CreatedByUserId,
                CreatedAt = vietnamNow,
                UpdatedAt = vietnamNow
            }).ToList();

            await _context.Notifications.AddRangeAsync(notifications, ct);
            await _context.SaveChangesAsync(ct);

            // Send realtime notification to all users
            foreach (var userId in activeUserIds)
            {
                try
                {
                    await ChatHub.SendNotification(
                        _hubContext,
                        userId,
                        draft.Title ?? "",
                        draft.Message ?? "",
                        draft.Type ?? "admin_broadcast"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ [NotificationService] Failed to send broadcast to user {userId}: {ex.Message}");
                }
            }

            Console.WriteLine($"✅ [NotificationService] Broadcast #{notificationId} sent to {activeUserIds.Count} users");
            return activeUserIds.Count;
        }

        /// <summary>
        /// Get all draft broadcast notifications
        /// </summary>
        public async Task<IEnumerable<Notification>> GetBroadcastDraftsAsync(CancellationToken ct = default)
        {
            return await _context.Notifications
                .Include(n => n.CreatedByUser)
                .Where(n => n.Status == "DRAFT" && n.IsBroadcast)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync(ct);
        }

        /// <summary>
        /// Get all sent broadcast notifications (original records only)
        /// </summary>
        public async Task<IEnumerable<Notification>> GetSentBroadcastsAsync(CancellationToken ct = default)
        {
            return await _context.Notifications
                .Include(n => n.CreatedByUser)
                .Where(n => n.Status == "SENT" && n.IsBroadcast && n.UserId == null)
                .OrderByDescending(n => n.SentAt)
                .ToListAsync(ct);
        }

        #endregion
    }
}




