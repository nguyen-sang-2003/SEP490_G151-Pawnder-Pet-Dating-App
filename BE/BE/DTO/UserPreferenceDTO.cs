namespace BE.DTO
{
    using System.ComponentModel.DataAnnotations;

    public record UserPreferenceResponse
    {
        public int AttributeId { get; init; }
        public string AttributeName { get; init; } = null!;
        public string? TypeValue { get; init; }
        public string? Unit { get; init; }
        public int? OptionId { get; init; }
        public string? OptionName { get; init; }
        public int? MaxValue { get; init; }
        public int? MinValue { get; init; }
        public DateTime? CreatedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
    }

    public record UserPreferenceUpsertRequest
    {
        public int? OptionId { get; init; }
        public int? MinValue { get; init; }
        public int? MaxValue { get; init; }
    }

    // DTO cho batch save preferences
    public record UserPreferenceBatchRequest
    {
        [Required]
        public int AttributeId { get; init; }
        
        // For string type attributes (select option)
        public int? OptionId { get; init; }
        
        // For float/number type attributes (range)
        public int? MinValue { get; init; }
        public int? MaxValue { get; init; }
    }

    public record UserPreferenceBatchUpsertRequest
    {
        [Required]
        public List<UserPreferenceBatchRequest> Preferences { get; init; } = new();
    }
}
