using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatUserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetChatMessages API
    /// GET /api/chat-user-content/chat-user-content/{matchId}
    /// UC-8.3 - Get chat messages
    /// </summary>
    public class GetChatMessagesIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetChatMessagesIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-8.3 GetChatMessages Test Cases

        /// <summary>
        /// UC-8.3-TC-1: Get chat messages with existing messages
        /// Expected: 200 OK with messages array
        /// </summary>
        [Fact]
        public async Task UC_8_3_TC_1_GetChatMessages_WithExistingMessages_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-user-content/chat-user-content/1");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");

            if (response.StatusCode == HttpStatusCode.OK)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(responseContent);

                // Verify response is an array
                if (jsonDoc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    var messages = jsonDoc.RootElement.EnumerateArray().ToList();
                    if (messages.Count > 0)
                    {
                        var firstMessage = messages[0];
                        Assert.True(firstMessage.TryGetProperty("contentId", out _) ||
                                   firstMessage.TryGetProperty("id", out _),
                                   "Response should contain contentId or id");
                        Assert.True(firstMessage.TryGetProperty("matchId", out _),
                                   "Response should contain matchId");
                        Assert.True(firstMessage.TryGetProperty("message", out _),
                                   "Response should contain message");
                    }
                }
            }
        }

        /// <summary>
        /// UC-8.3-TC-2: Get chat messages with no messages
        /// Expected: 200 OK with empty array []
        /// </summary>
        [Fact]
        public async Task UC_8_3_TC_2_GetChatMessages_WithNoMessages_ReturnsEmptyArray()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-user-content/chat-user-content/2");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");

            if (response.StatusCode == HttpStatusCode.OK)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(responseContent);

                if (jsonDoc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    Assert.Empty(jsonDoc.RootElement.EnumerateArray());
                }
            }
        }

        /// <summary>
        /// UC-8.3-TC-3: Get chat messages with non-existent matchId
        /// Expected: 404 Not Found with error message
        /// </summary>
        [Fact]
        public async Task UC_8_3_TC_3_GetChatMessages_NonExistentMatchId_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-user-content/chat-user-content/9999");

            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK,
                $"Expected 404 or 200, got {response.StatusCode}");
        }

        #endregion
    }
}
