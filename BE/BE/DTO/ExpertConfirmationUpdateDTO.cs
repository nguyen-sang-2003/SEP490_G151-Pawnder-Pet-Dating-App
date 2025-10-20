namespace BE.DTO
{
	public class ExpertConfirmationUpdateDTO
	{
		public int ExpertId { get; set; } 
		public string? ContentConfirmation { get; set; } 
		public bool? ContentAccurate { get; set; } 
		public string? Status { get; set; } 
	}
}
