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
}
