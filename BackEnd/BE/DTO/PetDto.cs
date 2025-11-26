namespace BE.DTO
{
    public class PetDto
    {
        public int PetId { get; set; }
        public string? Name { get; set; }
        public string? Breed { get; set; }
        public string? Gender { get; set; }
        public int? Age { get; set; }
        public bool? IsActive { get; set; }
        public string? Description { get; set; }
        public string? UrlImageAvatar{ get; set; }
    }
    public class PetDto_1
    {
        public int PetId { get; set; }
        public string? Name { get; set; }
        public string? Breed { get; set; }
        public string? Gender { get; set; }
        public int? Age { get; set; }
        public bool? IsActive { get; set; }
        public string? Description { get; set; }
        public List<string>? UrlImage { get; set; }
    }
    public class PetDto_2
    {
        public int UserId { get; set; }
        public string? Name { get; set; }
        public string? Breed { get; set; }
        public string? Gender { get; set; }
        public int? Age { get; set; }
        public bool? IsActive { get; set; }
        public string? Description { get; set; }
    }
}
