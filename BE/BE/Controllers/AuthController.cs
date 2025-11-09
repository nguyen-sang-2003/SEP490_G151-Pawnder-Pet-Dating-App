using BE.Models;
using BE.DTO;
using BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Security.Claims;

namespace BE.Controllers
{
    [ApiController]
    [Route("api")]
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
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return Unauthorized("Tài khoản không tồn tại");
            }

            bool isPasswordValid = _passwordService.VerifyPassword(request.Password, user.PasswordHash);

            if (!isPasswordValid)
                return Unauthorized("Sai mật khẩu");
            
            // Tạo Access Token (ngắn hạn - 30 phút)
            var accessToken = _tokenService.GenerateAccessToken(user.UserId, user.Role?.RoleName ?? "User");
            
            // Kiểm tra Refresh Token hiện tại có hợp lệ không
            string refreshToken;
            if (!string.IsNullOrEmpty(user.TokenJwt))
            {
                // Validate Refresh Token hiện tại
                var principal = _tokenService.GetPrincipalFromToken(user.TokenJwt, validateLifetime: true);
                if (principal != null)
                {
                    // Refresh Token còn hợp lệ, giữ nguyên
                    refreshToken = user.TokenJwt;
                }
                else
                {
                    // Refresh Token đã hết hạn hoặc không hợp lệ, tạo mới
                    refreshToken = _tokenService.GenerateRefreshToken(user.UserId, user.Role?.RoleName ?? "User");
                    user.TokenJwt = refreshToken;
                    user.UpdatedAt = DateTime.Now;
                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();
                }
            }
            else
            {
                // Chưa có Refresh Token, tạo mới
                refreshToken = _tokenService.GenerateRefreshToken(user.UserId, user.Role?.RoleName ?? "User");
                user.TokenJwt = refreshToken;
                user.UpdatedAt = DateTime.Now;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                Message = "Đăng nhập thành công",
                AccessToken = accessToken
            });
        }

        [HttpPost("refresh")]
        public async Task<ActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.RefreshToken))
                    return BadRequest("Refresh Token không được để trống");

                // Validate Refresh Token
                var principal = _tokenService.GetPrincipalFromToken(request.RefreshToken, validateLifetime: true);
                if (principal == null)
                    return Unauthorized("Refresh Token không hợp lệ hoặc đã hết hạn");

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized("Không thể xác định người dùng từ token");

                // Kiểm tra Refresh Token có trong database không
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);
                if (user == null || user.TokenJwt != request.RefreshToken)
                    return Unauthorized("Refresh Token không hợp lệ hoặc đã bị thu hồi");

                // Tạo Access Token mới
                var newAccessToken = _tokenService.GenerateAccessToken(user.UserId, user.Role?.RoleName ?? "User");
                
                // Tạo Refresh Token mới và cập nhật vào database
                var newRefreshToken = _tokenService.GenerateRefreshToken(user.UserId, user.Role?.RoleName ?? "User");
                
                user.TokenJwt = newRefreshToken;
                user.UpdatedAt = DateTime.Now;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Làm mới token thành công",
                    AccessToken = newAccessToken
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

       
        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Không xác định được người dùng.");

                var id = int.Parse(userId);

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
                if (user == null)
                    return NotFound("Không tìm thấy người dùng.");

                
                user.UpdatedAt = DateTime.Now;
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
