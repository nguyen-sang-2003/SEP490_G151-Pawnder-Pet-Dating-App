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

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync(ct);
            return notifications.Count;
        }

        public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
        {
            // Only count system and expert notifications
            return await _dbSet
                .Where(n => n.UserId == userId 
                           && !n.IsRead 
                           && (n.Type == "system" || n.Type == "expert"))
                .CountAsync(ct);
        }
    }
}




