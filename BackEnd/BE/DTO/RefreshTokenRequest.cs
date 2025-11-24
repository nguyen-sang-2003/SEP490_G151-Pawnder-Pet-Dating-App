using System.ComponentModel.DataAnnotations;

namespace BE.DTO
{
    public class RefreshTokenRequest
    {
        [Required(ErrorMessage = "Refresh Token không được để trống")]
        public string RefreshToken { get; set; } = null!;
    }
}
