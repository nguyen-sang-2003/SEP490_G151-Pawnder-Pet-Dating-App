namespace BE.DTO
{
	public class ExpertConfirmationDTO
	{
		public int UserId { get; set; }
		public int ChatAiId { get; set; }
		public int ExpertId { get; set; }
		public string? Status { get; set; }       
		public string? Message { get; set; }      
		public DateTime? CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }
	}
	public class ExpertConfirmationCreateDTO
	{
		public string? Message { get; set; }       
		public int ExpertId { get; set; }          
	}

	public class ExpertConfirmationResponseDTO
	{
		public int UserId { get; set; }
		public int ChatAiId { get; set; }
		public int ExpertId { get; set; }
		public string? Status { get; set; }
		public string? Message { get; set; }
		public string ResultMessage { get; set; } = null!;
		public DateTime? CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }
	}

	public class ExpertConfirmationUpdateDto
	{
		public string? Status { get; set; }          
		public string? Message { get; set; }         
	}
}
