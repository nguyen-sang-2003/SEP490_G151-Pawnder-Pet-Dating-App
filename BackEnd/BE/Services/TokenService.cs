using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BE.Services
{
    public class TokenService
    {
        private readonly string _secret;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly int _accessTokenExpirationMinutes;
        private readonly int _refreshTokenExpirationDays;

        public TokenService(IConfiguration config)
        {
            _secret = config["Jwt:Secret"] ?? throw new ArgumentNullException(nameof(config), "Jwt:Secret is required");
            _issuer = config["Jwt:Issuer"] ?? throw new ArgumentNullException(nameof(config), "Jwt:Issuer is required");
            _audience = config["Jwt:Audience"] ?? throw new ArgumentNullException(nameof(config), "Jwt:Audience is required");
            _accessTokenExpirationMinutes = int.Parse(config["Jwt:AccessTokenExpirationMinutes"] ?? "360");
            _refreshTokenExpirationDays = int.Parse(config["Jwt:RefreshTokenExpirationDays"] ?? "30");
        }

        /// <summary>
        /// Tạo Access Token (JWT) - ngắn hạn (1 phút mặc định)
        /// </summary>
        public string GenerateAccessToken(int userId, string role)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(_accessTokenExpirationMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Tạo Refresh Token (JWT) - dài hạn (30 ngày mặc định), lưu vào TokenJwt
        /// </summary>
        public string GenerateRefreshToken(int userId, string role)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim("token_type", "refresh"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.Now.AddDays(_refreshTokenExpirationDays),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Validate và lấy thông tin từ token (dùng cho cả Access Token và Refresh Token)
        /// </summary>
        public ClaimsPrincipal? GetPrincipalFromToken(string token, bool validateLifetime = true)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidateIssuer = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = validateLifetime,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret)),
                ValidIssuer = _issuer,
                ValidAudience = _audience
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
                
                if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                    return null;

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}
