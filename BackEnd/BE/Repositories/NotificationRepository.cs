using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class NotificationRepository : BaseRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync(CancellationToken ct = default)
        {
            return await _dbSet
                .Include(n => n.User)
                .Select(n => new NotificationDto
                {
                    NotificationId = n.NotificationId,
                    Title = n.Title,
                    Message = n.Message,
                    CreatedAt = n.CreatedAt,
                    UserId = n.UserId,
                    UserName = n.User != null ? n.User.FullName : null
                })
                .ToListAsync(ct);
        }

        public async Task<NotificationDto?> GetNotificationByIdAsync(int notificationId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(n => n.User)
                .Where(n => n.NotificationId == notificationId)
                .Select(n => new NotificationDto
                {
                    NotificationId = n.NotificationId,
                    Title = n.Title,
                    Message = n.Message,
                    CreatedAt = n.CreatedAt,
                    UserId = n.UserId,
                    UserName = n.User != null ? n.User.FullName : null
                })
                .FirstOrDefaultAsync(ct);
        }

        public async Task<IEnumerable<Notification>> GetNotificationsByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync(ct);
        }

        public async Task<int> MarkAllAsReadAsync(int userId, CancellationToken ct = default)
        {
            var notifications = await _dbSet
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync(ct);

            // Use Vietnam timezone (UTC+7) for consistency
            var vietnamNow = GetVietnamTime();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.UpdatedAt = vietnamNow;
            }

            await _context.SaveChangesAsync(ct);
            return notifications.Count;
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

        public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
        {
            // Count all unread notifications for the user
            return await _dbSet
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync(ct);
        }
    }
}




