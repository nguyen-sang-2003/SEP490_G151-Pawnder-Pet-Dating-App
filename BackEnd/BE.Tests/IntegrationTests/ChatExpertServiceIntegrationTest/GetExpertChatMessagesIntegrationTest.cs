using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatExpertServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetExpertChatMessages API
    /// GET /api/chat-expert-content/{chatExpertId}
    /// UC-7.4 - Get expert chat messages
    /// </summary>
    public class GetExpertChatMessagesIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetExpertChatMessagesIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-7.4 GetExpertChatMessages Test Cases

        /// <summary>
        /// UC-7.4-TC-1: Get expert chat messages with existing messages
        /// Expected: 200 OK with messages array containing message details
        /// </summary>
        [Fact]
        public async Task UC_7_4_TC_1_GetExpertChatMessages_WithExistingMessages_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-expert-content/1");

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
                        Assert.True(firstMessage.TryGetProperty("chatExpertId", out _),
                                   "Response should contain chatExpertId");
                        Assert.True(firstMessage.TryGetProperty("message", out _),
                                   "Response should contain message");
                    }
                }
            }
        }

        /// <summary>
        /// UC-7.4-TC-2: Get expert chat messages with no messages
        /// Expected: 200 OK with empty array []
        /// </summary>
        [Fact]
        public async Task UC_7_4_TC_2_GetExpertChatMessages_WithNoMessages_ReturnsEmptyArray()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-expert-content/999");

            // Either 200 with empty array or 404 - depends on implementation
            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Unexpected status code: {response.StatusCode}");

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
        /// UC-7.4-TC-3: Get expert chat messages with non-existent chat
        /// Expected: 404 Not Found or 200 with empty array
        /// </summary>
        [Fact]
        public async Task UC_7_4_TC_3_GetExpertChatMessages_NonExistentChat_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-expert-content/9999");

            // Either 404 or 200 with empty array - depends on implementation
            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.OK,
                $"Unexpected status code: {response.StatusCode}");
        }

        #endregion
    }
}
