using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace BE.Tests.IntegrationTests
{
    /// <summary>
    /// Helper class để tạo JWT token cho integration tests
    /// </summary>
    public static class TestAuthHelper
    {
        private const string TestSecretKey = "TestSecretKeyForIntegrationTests_AtLeast32Characters!";
        private const string TestIssuer = "TestIssuer";
        private const string TestAudience = "TestAudience";

        /// <summary>
        /// Tạo JWT token cho test user với role chỉ định
        /// </summary>
        public static string GenerateTestToken(int userId, string email, string role)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: TestIssuer,
                audience: TestAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Thêm Authorization header vào HttpClient
        /// </summary>
        public static void AddAuthorizationHeader(HttpClient client, int userId, string email, string role)
        {
            var token = GenerateTestToken(userId, email, role);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
    }
}
