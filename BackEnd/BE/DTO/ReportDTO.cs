namespace BE.DTO
{
	public class ReportDto
	{
		public int ReportId { get; set; }
		public string? Reason { get; set; }
		public string? Status { get; set; }
		public string? Resolution { get; set; }
		public DateTime? CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }
		public int? ContentId { get; set; }
		public ContentDto? Content { get; set; }
		public UserReportDto? UserReport { get; set; }
		public UserReportDto? ReportedUser { get; set; }
	}

	public class ContentDto
	{
		public int ContentId { get; set; }
		public string? Message { get; set; }
		public DateTime? CreatedAt { get; set; }
	}

	public class UserReportDto
	{
		public int UserId { get; set; }
		public string? FullName { get; set; }
		public string Email { get; set; } = null!;
	}
	public class ReportCreateDTO
	{
		public string Reason { get; set; } = null!;
	}

	public class ReportUpdateDTO
	{
		public string? Status { get; set; }
		public string? Resolution { get; set; }
	}

}
