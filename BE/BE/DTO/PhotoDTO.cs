// BE/DTO/PetPhotoResponse.cs
namespace BE.DTO
{
    public record PetPhotoResponse
    {
        public int PhotoId { get; init; }
        public int PetId { get; init; }
        public string Url { get; init; } = null!;
        public bool IsPrimary { get; init; }
        public int SortOrder { get; init; }
    }

    public record ReorderPhotoRequest
    {
        public int PhotoId { get; init; }
        public int SortOrder { get; init; }
    }
}
