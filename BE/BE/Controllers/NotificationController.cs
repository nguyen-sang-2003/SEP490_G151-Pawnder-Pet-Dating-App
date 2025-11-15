using BE.DTO;
using BE.Models;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho Notification - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : Controller
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // GET /notification
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult> GetAllNotifications(CancellationToken ct = default)
        {
            try
            {
                var notifications = await _notificationService.GetAllNotificationsAsync(ct);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /notification/{notificationId}
        [Authorize(Roles = "Admin,User")]
        [HttpGet("{notificationId:int}")]
        public async Task<ActionResult> GetNotificationById(int notificationId, CancellationToken ct = default)
        {
            try
            {
                var notification = await _notificationService.GetNotificationByIdAsync(notificationId, ct);
                
                if (notification == null)
                    return NotFound(new { Message = "Không tìm thấy thông báo" });

                return Ok(notification);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /notification/user/{userId}
        [Authorize(Roles = "User")]
        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetNotificationsByUserId(int userId, CancellationToken ct = default)
        {
            try
            {
                var notifications = await _notificationService.GetNotificationsByUserIdAsync(userId, ct);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /notification
        [Authorize(Roles = "Admin,User")]
        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] NotificationDto_1 notificationDto, CancellationToken ct = default)
        {
            try
            {
                var notification = await _notificationService.CreateNotificationAsync(notificationDto, ct);
                return CreatedAtAction(nameof(GetNotificationById), new { notificationId = notification.NotificationId }, notification);
            }
            catch (ArgumentNullException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
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
        public async Task<IActionResult> DeleteNotification(int notificationId, CancellationToken ct = default)
        {
            try
            {
                var success = await _notificationService.DeleteNotificationAsync(notificationId, ct);
                
                if (!success)
                    return NotFound(new { Message = "Không tìm thấy thông báo" });

                return Ok(new { Message = "Đã xóa thông báo thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }
    }
}
