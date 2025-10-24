namespace BE.DTO
{
    public record OptionResponse
    {
        public int OptionId { get; set; }

        public int? AttributeId { get; set; }

        public string Name { get; set; } = null!;

        public bool? IsDeleted { get; set; }

    }
}