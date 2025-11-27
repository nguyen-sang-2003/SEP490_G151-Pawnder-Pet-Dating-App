using Microsoft.AspNetCore.Http;

namespace BE.DTO
{
    public class PetImageAnalysisRequest
    {
        public IFormFile Image { get; set; } = null!;
    }

    public class PetImageAnalysisResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<AttributeAnalysisResult>? Attributes { get; set; }
        public string? SqlInsertScript { get; set; }
    }

    public class AttributeAnalysisResult
    {
        public string AttributeName { get; set; } = string.Empty;
        public string? OptionName { get; set; }
        public int? Value { get; set; }
        public int? AttributeId { get; set; }
        public int? OptionId { get; set; }
    }

    public class PetCharacteristicInsertRequest
    {
        public int PetId { get; set; }
        public List<AttributeAnalysisResult> Attributes { get; set; } = new List<AttributeAnalysisResult>();
    }
}
