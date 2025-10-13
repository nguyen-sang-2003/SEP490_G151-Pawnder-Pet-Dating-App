using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Security.Claims;

namespace BE.Controlers
{
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly PawnderDatabaseContext _context;
        private readonly PasswordService _passwordService;
        private readonly TokenService _tokenService;
        public AuthController(PawnderDatabaseContext context, TokenService tokenService)
        {
            _context = context;
            _passwordService = new PasswordService();
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            var user = _context.Users.Include(u => u.Role).FirstOrDefault(u => u.Email == request.Email);
            if (user == null)
            {
                return Unauthorized("Tài khoản không tồn tại");
            }

            bool isPasswordValid = _passwordService.VerifyPassword(request.Password, user.Passwordhash);

            if (!isPasswordValid)
                return Unauthorized("Sai mật khẩu");
            
            var token = _tokenService.GenerateToken(user.Userid,user.Role.Rolename);

            user.Tokenjwt = token;
            _context.Users.Update(user);
            _context.SaveChanges();

            return Ok(new
            {
                Message = "Đăng nhập thành công",
                Token = token
            });
        }
        public class LoginRequest
        {
            [Required(ErrorMessage = "Email không được để trống")]
            [EmailAddress(ErrorMessage = "Email không hợp lệ")]
            public string Email { get; set; }
            [Required(ErrorMessage = "Mật khẩu không được để trống")]
            [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải ít nhất 6 ký tự")]
            public string Password { get; set; }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Không xác định được người dùng.");

                var id = int.Parse(userId);

                var user = _context.Users.FirstOrDefault(u => u.Userid == id);
                if (user == null)
                    return NotFound("Không tìm thấy người dùng.");

                user.Tokenjwt = null;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok("Đăng xuất thành công.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }
    }
}
