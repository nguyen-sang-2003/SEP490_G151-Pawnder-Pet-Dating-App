namespace BE.DTO
{
    public class BadWordDto
    {
        public int? BadWordId { get; set; }
        public string Word { get; set; } = null!;
        public bool IsRegex { get; set; }
        public int Level { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateBadWordRequest
    {
        public string Word { get; set; } = null!;
        public bool IsRegex { get; set; }
        public int Level { get; set; }
        public string? Category { get; set; }
    }

    public class UpdateBadWordRequest
    {
        public string? Word { get; set; }
        public bool? IsRegex { get; set; }
        public int? Level { get; set; }
        public string? Category { get; set; }
        public bool? IsActive { get; set; }
    }
}

