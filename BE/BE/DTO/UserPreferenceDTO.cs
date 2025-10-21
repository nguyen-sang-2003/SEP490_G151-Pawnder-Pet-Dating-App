namespace BE.DTO
{
    using System.ComponentModel.DataAnnotations;

    public record UserPreferenceResponse
    {
        public int AttributeId { get; init; }
        public string AttributeName { get; init; } = null!;
        public string? TypeValue { get; init; }
        public string? Unit { get; init; }

        public string? Value { get; init; }
        public DateTime? CreatedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
    }

    public record UserPreferenceUpsertRequest
    {
        [Required]
        public string? Value { get; init; }
    }
}
