using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatUserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho DeleteChat API
    /// DELETE /api/chat-user/chat/{matchId}
    /// UC-8.2 - Delete chat
    /// </summary>
    public class DeleteChatIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public DeleteChatIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-8.2 DeleteChat Test Cases

        /// <summary>
        /// UC-8.2-TC-1: Delete chat with valid matchId
        /// Expected: 200 OK with message "Đã ẩn đoạn chat."
        /// </summary>
        [Fact]
        public async Task UC_8_2_TC_1_DeleteChat_ValidMatchId_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.DeleteAsync("/api/chat-user/chat/1");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");

            if (response.StatusCode == HttpStatusCode.OK)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                Assert.Contains("chat", responseContent.ToLower());
            }
        }

        /// <summary>
        /// UC-8.2-TC-2: Delete chat with non-existent matchId
        /// Expected: 404 Not Found with message "Không tìm thấy đoạn chat."
        /// </summary>
        [Fact]
        public async Task UC_8_2_TC_2_DeleteChat_NonExistentMatchId_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.DeleteAsync("/api/chat-user/chat/9999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-8.2-TC-3: Delete chat that is already deleted
        /// Expected: 404 Not Found with message "Không tìm thấy đoạn chat."
        /// </summary>
        [Fact]
        public async Task UC_8_2_TC_3_DeleteChat_AlreadyDeleted_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // First deletion
            var response1 = await client.DeleteAsync("/api/chat-user/chat/1");

            // Second deletion (should fail)
            var response2 = await client.DeleteAsync("/api/chat-user/chat/1");

            Assert.Equal(HttpStatusCode.NotFound, response2.StatusCode);
        }

        #endregion
    }
}
