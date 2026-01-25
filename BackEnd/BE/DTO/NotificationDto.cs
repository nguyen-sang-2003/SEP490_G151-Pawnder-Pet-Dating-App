namespace BE.DTO
{
    public class NotificationDto
    {
        public int NotificationId { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; } 
    }
    public class NotificationDto_1
    {
        public string? Title { get; set; }
        public string? Message { get; set; }
        public int? UserId { get; set; }
        public string? Type { get; set; }
    }

    // DTO for creating/updating broadcast notification
    public class BroadcastNotificationRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? Type { get; set; }
    }

    // DTO for broadcast notification response
    public class BroadcastNotificationResponse
    {
        public int NotificationId { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; }
        public string Status { get; set; } = "DRAFT";
        public DateTime? CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public int? CreatedByUserId { get; set; }
        public string? CreatedByUserName { get; set; }
    }
}
