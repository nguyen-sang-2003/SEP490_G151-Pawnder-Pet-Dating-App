namespace BE.DTO
{
	public class ExpertConfirmationDTO
	{
		public int UserId { get; set; }
		public int ChatAiId { get; set; }
		public int ExpertId { get; set; }
		public string? Status { get; set; }       
		public string? Message { get; set; }
		public string? UserQuestion { get; set; }
		public DateTime? CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }
	}
	public class ExpertConfirmationCreateDTO
	{
		public string? Message { get; set; }       
		public int? ExpertId { get; set; }  // Optional - will be auto-assigned if not provided
		public string? UserQuestion { get; set; }
	}

	public class ExpertConfirmationResponseDTO
	{
		public int UserId { get; set; }
		public int ChatAiId { get; set; }
		public int ExpertId { get; set; }
		public string? Status { get; set; }
		public string? Message { get; set; }
		public string? UserQuestion { get; set; }
		public string ResultMessage { get; set; } = null!;
		public DateTime? CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }
	}

	public class ExpertConfirmationUpdateDto
	{
		public string? Status { get; set; }          
		public string? Message { get; set; }         
	}

	public class ReassignExpertConfirmationRequest
	{
		public int UserId { get; set; }
		public int ChatAiId { get; set; }
		public int? FromExpertId { get; set; }
		public int ToExpertId { get; set; }
		public string? Message { get; set; }
		// If true, keep the old Status; otherwise reset to "pending"
		public bool KeepStatus { get; set; } = false;
	}

	public class ReassignExpertConfirmationResponse
	{
		public int UserId { get; set; }
		public int ChatAiId { get; set; }
		public int ExpertId { get; set; }
		public string? Status { get; set; }
		public string? Message { get; set; }
		public string? UserQuestion { get; set; }
		public DateTime? CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }
		public string ResultMessage { get; set; } = "Đã chuyển yêu cầu xác nhận sang chuyên gia khác.";
	}
}
