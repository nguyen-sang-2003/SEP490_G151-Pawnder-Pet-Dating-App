namespace BE.DTO
{
	public class ExpertConfirmationDTO
	{
		public int ConfirmationId { get; set; }

		public int? UserRequestId { get; set; }
		public string? UserRequestName { get; set; }

		public int? ExpertId { get; set; }
		public string? ExpertName { get; set; }

		public string? ContentConfirmation { get; set; }
		public bool? ContentAccurate { get; set; }

		public string? Status { get; set; }
		public DateTime? CreatedAt { get; set; }
		public DateTime? UpdatedAt { get; set; }
	}
}
