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

        #region Broadcast Notification Endpoints (Admin)

        // GET /notification/broadcast/drafts
        [Authorize(Roles = "Admin")]
        [HttpGet("broadcast/drafts")]
        public async Task<IActionResult> GetBroadcastDrafts(CancellationToken ct = default)
        {
            try
            {
                var drafts = await _notificationService.GetBroadcastDraftsAsync(ct);
                var response = drafts.Select(n => new BroadcastNotificationResponse
                {
                    NotificationId = n.NotificationId,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    Status = n.Status,
                    CreatedAt = n.CreatedAt,
                    SentAt = n.SentAt,
                    CreatedByUserId = n.CreatedByUserId,
                    CreatedByUserName = n.CreatedByUser?.FullName
                });
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /notification/broadcast/sent
        [Authorize(Roles = "Admin")]
        [HttpGet("broadcast/sent")]
        public async Task<IActionResult> GetSentBroadcasts(CancellationToken ct = default)
        {
            try
            {
                var sent = await _notificationService.GetSentBroadcastsAsync(ct);
                var response = sent.Select(n => new BroadcastNotificationResponse
                {
                    NotificationId = n.NotificationId,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    Status = n.Status,
                    CreatedAt = n.CreatedAt,
                    SentAt = n.SentAt,
                    CreatedByUserId = n.CreatedByUserId,
                    CreatedByUserName = n.CreatedByUser?.FullName
                });
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /notification/broadcast
        [Authorize(Roles = "Admin")]
        [HttpPost("broadcast")]
        public async Task<IActionResult> CreateBroadcastDraft([FromBody] BroadcastNotificationRequest request, CancellationToken ct = default)
        {
            try
            {
                // Get admin user id from token (using ClaimTypes.NameIdentifier)
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int adminUserId))
                {
                    return Unauthorized(new { Message = "Không xác định được người dùng" });
                }

                var notification = await _notificationService.CreateBroadcastDraftAsync(
                    request.Title, 
                    request.Message, 
                    adminUserId, 
                    request.Type, 
                    ct
                );

                return CreatedAtAction(nameof(GetNotificationById), 
                    new { notificationId = notification.NotificationId }, 
                    new BroadcastNotificationResponse
                    {
                        NotificationId = notification.NotificationId,
                        Title = notification.Title,
                        Message = notification.Message,
                        Type = notification.Type,
                        Status = notification.Status,
                        CreatedAt = notification.CreatedAt,
                        CreatedByUserId = notification.CreatedByUserId
                    });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT /notification/broadcast/{notificationId}
        [Authorize(Roles = "Admin")]
        [HttpPut("broadcast/{notificationId:int}")]
        public async Task<IActionResult> UpdateBroadcastDraft(int notificationId, [FromBody] BroadcastNotificationRequest request, CancellationToken ct = default)
        {
            try
            {
                var notification = await _notificationService.UpdateBroadcastDraftAsync(
                    notificationId, 
                    request.Title, 
                    request.Message, 
                    request.Type, 
                    ct
                );

                if (notification == null)
                    return NotFound(new { Message = "Không tìm thấy bản nháp hoặc đã được gửi" });

                return Ok(new BroadcastNotificationResponse
                {
                    NotificationId = notification.NotificationId,
                    Title = notification.Title,
                    Message = notification.Message,
                    Type = notification.Type,
                    Status = notification.Status,
                    CreatedAt = notification.CreatedAt,
                    CreatedByUserId = notification.CreatedByUserId
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // DELETE /notification/broadcast/{notificationId}
        [Authorize(Roles = "Admin")]
        [HttpDelete("broadcast/{notificationId:int}")]
        public async Task<IActionResult> DeleteBroadcastDraft(int notificationId, CancellationToken ct = default)
        {
            try
            {
                var success = await _notificationService.DeleteBroadcastDraftAsync(notificationId, ct);
                
                if (!success)
                    return NotFound(new { Message = "Không tìm thấy bản nháp hoặc đã được gửi" });

                return Ok(new { Message = "Đã xóa bản nháp thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /notification/broadcast/{notificationId}/send
        [Authorize(Roles = "Admin")]
        [HttpPost("broadcast/{notificationId:int}/send")]
        public async Task<IActionResult> SendBroadcast(int notificationId, CancellationToken ct = default)
        {
            try
            {
                var count = await _notificationService.SendBroadcastAsync(notificationId, ct);
                return Ok(new { 
                    Message = $"Đã gửi thông báo đến {count} người dùng",
                    SentCount = count
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        #endregion
    }
}
