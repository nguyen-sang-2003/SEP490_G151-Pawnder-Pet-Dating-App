using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AuthServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho RefreshToken API
    /// POST /api/refresh
    /// </summary>
    public class RefreshTokenIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public RefreshTokenIntegrationTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        #region UC-4.2 RefreshToken Test Cases

        /// <summary>
        /// UC-4.2-TC-1: Refresh token with valid refresh token
        /// Expected: 200 OK with new tokens
        /// Note: This test requires a valid token from login first
        /// </summary>
        [Fact]
        public async Task UC_4_2_TC_1_RefreshToken_ValidToken_Returns200()
        {
            var client = _factory.CreateClient();
            
            // First login to get a valid refresh token
            var loginRequest = new
            {
                email = "user@example.com",
                password = "Test@123",
                platform = "user"
            };
            var loginContent = new StringContent(JsonSerializer.Serialize(loginRequest), Encoding.UTF8, "application/json");
            var loginResponse = await client.PostAsync("/api/login", loginContent);
            var loginResponseContent = await loginResponse.Content.ReadAsStringAsync();
            
            // Parse the refresh token from login response
            using var doc = JsonDocument.Parse(loginResponseContent);
            var refreshToken = doc.RootElement.GetProperty("refreshToken").GetString();

            // Use the refresh token
            var refreshRequest = new { refreshToken = refreshToken };
            var refreshContent = new StringContent(JsonSerializer.Serialize(refreshRequest), Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync("/api/refresh", refreshContent);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Làm mới token thành công", responseContent);
            Assert.Contains("accessToken", responseContent, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// UC-4.2-TC-2: Refresh token with empty refresh token
        /// Expected: 400 Bad Request with message
        /// </summary>
        [Fact]
        public async Task UC_4_2_TC_2_RefreshToken_EmptyToken_Returns400()
        {
            var client = _factory.CreateClient();
            var request = new { refreshToken = "" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/refresh", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Refresh Token không được để trống", responseContent);
        }

        /// <summary>
        /// UC-4.2-TC-3: Refresh token with invalid token format
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_4_2_TC_3_RefreshToken_InvalidToken_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { refreshToken = "invalid.token.here" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/refresh", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Refresh Token không hợp lệ hoặc đã hết hạn", responseContent);
        }

        /// <summary>
        /// UC-4.2-TC-4: Refresh token with expired token
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_4_2_TC_4_RefreshToken_ExpiredToken_Returns401()
        {
            var client = _factory.CreateClient();
            // This is a malformed/expired token that won't validate
            var request = new { refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6MTYwOTQ0NDQ0NH0.expired" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/refresh", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Refresh Token không hợp lệ hoặc đã hết hạn", responseContent);
        }

        /// <summary>
        /// UC-4.2-TC-5: Refresh token with revoked token (token not matching database)
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_4_2_TC_5_RefreshToken_RevokedToken_Returns401()
        {
            var client = _factory.CreateClient();
            // A valid-looking but revoked token
            var request = new { refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJVc2VyIn0.revoked" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/refresh", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
