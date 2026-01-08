using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.BlockServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho DeleteBlock API
    /// DELETE /block/{fromUserId}/{toUserId}
    /// </summary>
    public class DeleteBlockIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public DeleteBlockIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-5.3 DeleteBlock Test Cases

        /// <summary>
        /// UC-5.3-TC-1: Delete block with valid users
        /// Expected: 200 OK with message "Hủy chặn người dùng thành công."
        /// </summary>
        [Fact]
        public async Task UC_5_3_TC_1_DeleteBlock_ValidUsers_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // First create a block
            await client.PostAsync("/block/1/2", null);

            // Then delete it
            var response = await client.DeleteAsync("/block/1/2");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Hủy chặn người dùng thành công", responseContent);
        }

        /// <summary>
        /// UC-5.3-TC-2: Delete block with non-existent block
        /// Expected: 404 Not Found with message "Chưa chặn người dùng này hoặc đã hủy chặn."
        /// </summary>
        [Fact]
        public async Task UC_5_3_TC_2_DeleteBlock_NonExistentBlock_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.DeleteAsync("/block/1/9999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Chưa chặn người dùng này hoặc đã hủy chặn", responseContent);
        }

        /// <summary>
        /// UC-5.3-TC-3: Delete block that was already deleted
        /// Expected: 404 Not Found with message "Chưa chặn người dùng này hoặc đã hủy chặn."
        /// </summary>
        [Fact]
        public async Task UC_5_3_TC_3_DeleteBlock_AlreadyDeleted_Returns404()
        {
            var client = CreateAuthenticatedClient(100, "User", "user@example.com");

            // First create a block
            await client.PostAsync("/block/100/101", null);

            // Delete once
            await client.DeleteAsync("/block/100/101");

            // Try to delete again
            var response = await client.DeleteAsync("/block/100/101");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Chưa chặn người dùng này hoặc đã hủy chặn", responseContent);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task DeleteBlock_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.DeleteAsync("/block/1/2");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
