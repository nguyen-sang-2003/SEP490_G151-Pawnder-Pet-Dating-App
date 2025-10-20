namespace BE.DTO
{
	public class ReportDTO
	{
		public int Reportid { get; set; }
		public string? Reason { get; set; }
		public string? Status { get; set; }
		public string? Resolution { get; set; }
		public DateTime? Createdat { get; set; }
		public DateTime? Updatedat { get; set; }

		public UserDTO? Fromuser { get; set; }
		public UserDTO? Touser { get; set; }
	}

	public class UserDTO
	{
		public int Userid { get; set; }
		public string? Fullname { get; set; }
		public string? Email { get; set; }
	}

}
