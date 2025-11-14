using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : Controller
    {
        private readonly PawnderDatabaseContext _context;
        public NotificationController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // GET /notification
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult> GetAllNotifications()
        {
            var notifications = await _context.Notifications
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
                .ToListAsync();

            return Ok(notifications);
        }

        // GET /notification/{notificationId}
        [Authorize(Roles = "Admin,User")]
        [HttpGet("{notificationId:int}")]
        public async Task<ActionResult> GetNotificationById(int notificationId)
        {
            var notification = await _context.Notifications
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
                .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

            if (notification == null)
                return NotFound(new { Message = "Không tìm thấy thông báo" });

            return Ok(notification);
        }

        // GET /notification/user/{userId}
        [Authorize(Roles ="User")]
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetNotificationsByUserId(int userId)
        {
            // Return all notifications (filter removed for now)
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        // POST /notification
        [Authorize(Roles = "Admin,User")]
        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] NotificationDto_1 notificationDto)
        {
            if (notificationDto == null)
                return BadRequest(new { Message = "Thông báo không hợp lệ" });

            Notification notification = new Notification();

            notification.UserId = notificationDto.UserId;
            notification.Title = notificationDto.Title; 
            notification.Message = notificationDto.Message;
            notification.CreatedAt = DateTime.Now;
            notification.UpdatedAt = DateTime.Now;

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNotificationById), new { notificationId = notification.NotificationId }, notification);
        }

        // PUT /notification/{notificationId}/read
        [Authorize(Roles = "User")]
        [HttpPut("{notificationId:int}/read")]
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
                return NotFound(new { Message = "Không tìm thấy thông báo" });

            notification.IsRead = true;
            notification.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã đánh dấu đã đọc" });
        }

        // PUT /notification/user/{userId}/read-all
        [Authorize(Roles = "User")]
        [HttpPut("user/{userId:int}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã đánh dấu {notifications.Count} thông báo đã đọc" });
        }

        // GET /notification/user/{userId}/unread-count
        [Authorize(Roles = "User")]
        [HttpGet("user/{userId:int}/unread-count")]
        public async Task<IActionResult> GetUnreadCount(int userId)
        {
            // Only count admin and expert notifications
            // Type values: "system" or "expert"
            var count = await _context.Notifications
                .Where(n => n.UserId == userId 
                           && !n.IsRead 
                           && (n.Type == "system" || n.Type == "expert"))
                .CountAsync();

            return Ok(new { count });
        }

        // DELETE /notification/{notificationId}
        [Authorize(Roles = "Admin,User")]
        [HttpDelete("{notificationId:int}")]
        public async Task<IActionResult> DeleteNotification(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
                return NotFound(new { Message = "Không tìm thấy thông báo" });

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã xóa thông báo thành công" });
        }
    }
}
