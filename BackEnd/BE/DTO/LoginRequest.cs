using System.ComponentModel.DataAnnotations;

namespace BE.DTO
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public required string Email { get; set; }
        
        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải ít nhất 6 ký tự")]
        public required string Password { get; set; }
        
        /// <summary>
        /// Platform type: "user" for mobile app (User only), "admin" for web (Admin/Expert only)
        /// If not provided, defaults to "user"
        /// </summary>
        public string? Platform { get; set; }
    }
}
