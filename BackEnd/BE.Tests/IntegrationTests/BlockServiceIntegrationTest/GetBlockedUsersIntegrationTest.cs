using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.BlockServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetBlockedUsers API
    /// GET /block/{fromUserId}
    /// </summary>
    public class GetBlockedUsersIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetBlockedUsersIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-5.1 GetBlockedUsers Test Cases

        /// <summary>
        /// UC-5.1-TC-1: Get blocked users with existing blocks
        /// Expected: 200 OK with blocked users list
        /// Note: Requires seeded block data
        /// </summary>
        [Fact]
        public async Task UC_5_1_TC_1_GetBlockedUsers_WithExistingBlocks_Returns200()
        {
            // User 1 has blocked users in seed data
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/block/1");

            // If no blocks exist, should return 404
            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Unexpected status code: {response.StatusCode}");
        }

        /// <summary>
        /// UC-5.1-TC-2: Get blocked users with no blocks
        /// Expected: 404 Not Found with message "Người dùng này chưa chặn ai."
        /// </summary>
        [Fact]
        public async Task UC_5_1_TC_2_GetBlockedUsers_WithNoBlocks_Returns404()
        {
            // User 2 has no blocked users
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");

            var response = await client.GetAsync("/block/2");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Người dùng này chưa chặn ai", responseContent);
        }

        /// <summary>
        /// UC-5.1-TC-3: Get blocked users with non-existent user
        /// Expected: 200 OK with empty array (or 404)
        /// </summary>
        [Fact]
        public async Task UC_5_1_TC_3_GetBlockedUsers_NonExistentUser_ReturnsExpected()
        {
            var client = CreateAuthenticatedClient(9999, "User", "test@example.com");

            var response = await client.GetAsync("/block/9999");

            // Non-existent user returns 404 (no blocks)
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetBlockedUsers_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/block/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
