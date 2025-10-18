namespace BE.DTO
{
    public class AttributesDTO
    {
        public int Attributeid { get; set; }

        public string Name { get; set; } = null!;

        public string? Typevalue { get; set; }

        public string? Unit { get; set; }

        public DateTime? Createdat { get; set; }

        public DateTime? Updatedat { get; set; }

    }
}
