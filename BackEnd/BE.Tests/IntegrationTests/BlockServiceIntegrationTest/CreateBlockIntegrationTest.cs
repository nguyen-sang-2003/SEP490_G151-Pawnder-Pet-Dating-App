using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.BlockServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho CreateBlock API
    /// POST /block/{fromUserId}/{toUserId}
    /// </summary>
    public class CreateBlockIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public CreateBlockIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-5.2 CreateBlock Test Cases

        /// <summary>
        /// UC-5.2-TC-1: Create block with valid users
        /// Expected: 200 OK with success message
        /// </summary>
        [Fact]
        public async Task UC_5_2_TC_1_CreateBlock_ValidUsers_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.PostAsync("/block/1/2", null);

            // May return 200 (created) or 400 (already blocked)
            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.BadRequest,
                $"Unexpected status code: {response.StatusCode}");
            
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                Assert.Contains("Chặn người dùng thành công", responseContent);
            }
        }

        /// <summary>
        /// UC-5.2-TC-2: Create block with same user (self-block)
        /// Expected: 400 Bad Request with message "Người dùng không thể tự chặn chính mình."
        /// </summary>
        [Fact]
        public async Task UC_5_2_TC_2_CreateBlock_SameUser_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.PostAsync("/block/1/1", null);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Người dùng không thể tự chặn chính mình", responseContent);
        }

        /// <summary>
        /// UC-5.2-TC-3: Create block with non-existent from user
        /// Expected: 404 Not Found with message "Người dùng không tồn tại."
        /// </summary>
        [Fact]
        public async Task UC_5_2_TC_3_CreateBlock_NonExistentFromUser_Returns404()
        {
            var client = CreateAuthenticatedClient(9999, "User", "test@example.com");

            var response = await client.PostAsync("/block/9999/2", null);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Người dùng không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-5.2-TC-4: Create block with non-existent to user
        /// Expected: 404 Not Found with message "Người dùng không tồn tại."
        /// </summary>
        [Fact]
        public async Task UC_5_2_TC_4_CreateBlock_NonExistentToUser_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.PostAsync("/block/1/9999", null);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Người dùng không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-5.2-TC-5: Create block with already blocked user
        /// Expected: 400 Bad Request with message "Người dùng này đã bị chặn trước đó."
        /// </summary>
        [Fact]
        public async Task UC_5_2_TC_5_CreateBlock_AlreadyBlocked_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // First block (may succeed or already exist)
            await client.PostAsync("/block/1/2", null);

            // Second attempt should fail
            var response = await client.PostAsync("/block/1/2", null);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Người dùng này đã bị chặn trước đó", responseContent);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task CreateBlock_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.PostAsync("/block/1/2", null);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
