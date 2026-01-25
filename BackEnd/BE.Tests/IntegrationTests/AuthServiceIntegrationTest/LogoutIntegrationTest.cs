using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.AuthServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho Logout API
    /// POST /api/logout
    /// </summary>
    public class LogoutIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public LogoutIntegrationTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        private HttpClient CreateAuthenticatedClient(int userId, string role = "User", string email = "test@example.com")
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
            client.DefaultRequestHeaders.Add("X-Test-Role", role);
            client.DefaultRequestHeaders.Add("X-Test-Email", email);
            return client;
        }

        #region UC-4.3 Logout Test Cases

        /// <summary>
        /// UC-4.3-TC-1: Logout with valid authentication
        /// Expected: 200 OK with message "Đăng xuất thành công."
        /// </summary>
        [Fact]
        public async Task UC_4_3_TC_1_Logout_ValidAuth_Returns200()
        {
            var client = CreateAuthenticatedClient(100, "User", "user@example.com");

            var response = await client.PostAsync("/api/logout", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đăng xuất thành công", responseContent);
        }

        /// <summary>
        /// UC-4.3-TC-2: Logout without authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_4_3_TC_2_Logout_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.PostAsync("/api/logout", null);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// UC-4.3-TC-3: Logout with invalid token (no test headers)
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_4_3_TC_3_Logout_InvalidToken_Returns401()
        {
            var client = _factory.CreateClient();
            // Add invalid/missing authentication
            client.DefaultRequestHeaders.Add("Authorization", "Bearer invalid.token.here");

            var response = await client.PostAsync("/api/logout", null);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// UC-4.3-TC-4: Logout with non-existent user
        /// Expected: 404 Not Found with message "Không tìm thấy người dùng."
        /// </summary>
        [Fact]
        public async Task UC_4_3_TC_4_Logout_NonExistentUser_Returns404()
        {
            var client = CreateAuthenticatedClient(9999, "User", "nonexistent@example.com");

            var response = await client.PostAsync("/api/logout", null);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy người dùng", responseContent);
        }

        #endregion
    }
}
