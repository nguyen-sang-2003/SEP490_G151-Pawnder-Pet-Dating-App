namespace BE.DTO
{
    public class SendMessageRequestChatExpert
    {
        public string Message { get; set; } = string.Empty;
        public int? ExpertId { get; set; }
        public int? UserId { get; set; }
        public int? ChatAiid { get; set; }
    }
}

