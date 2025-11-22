using BE.DTO;
using BE.Models;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        [Authorize(Roles = "Admin,User,Expert")]
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
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (DbUpdateException dbEx)
            {
                // Log detailed database error
                var innerException = dbEx.InnerException?.Message ?? dbEx.Message;
                return StatusCode(500, new { 
                    Message = "Lỗi khi lưu vào database", 
                    Error = innerException,
                    Details = dbEx.Message
                });
            }
            catch (Exception ex)
            {
                // Log full exception details for debugging
                var innerException = ex.InnerException?.Message ?? "";
                return StatusCode(500, new { 
                    Message = "Lỗi hệ thống", 
                    Error = ex.Message,
                    InnerException = innerException,
                    StackTrace = ex.StackTrace
                });
            }
        }

        // PUT /notification/{notificationId}/read
        [Authorize(Roles = "User")]
        [HttpPut("{notificationId:int}/read")]
        public async Task<IActionResult> MarkAsRead(int notificationId, CancellationToken ct = default)
        {
            try
            {
                var success = await _notificationService.MarkAsReadAsync(notificationId, ct);
                
                if (!success)
                    return NotFound(new { Message = "Không tìm thấy thông báo" });

                return Ok(new { Message = "Đã đánh dấu đã đọc" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT /notification/user/{userId}/read-all
        [Authorize(Roles = "User")]
        [HttpPut("user/{userId:int}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(int userId, CancellationToken ct = default)
        {
            try
            {
                var count = await _notificationService.MarkAllAsReadAsync(userId, ct);
                return Ok(new { Message = $"Đã đánh dấu {count} thông báo đã đọc" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /notification/user/{userId}/unread-count
        [Authorize(Roles = "User")]
        [HttpGet("user/{userId:int}/unread-count")]
        public async Task<IActionResult> GetUnreadCount(int userId, CancellationToken ct = default)
        {
            try
            {
                var count = await _notificationService.GetUnreadCountAsync(userId, ct);
                return Ok(new { count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
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
