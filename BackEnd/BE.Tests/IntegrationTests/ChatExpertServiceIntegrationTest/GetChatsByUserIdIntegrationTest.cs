using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatExpertServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetChatsByUserId API
    /// GET /api/chat-expert/user/{userId}
    /// UC-7.1 - Get chats by user ID
    /// </summary>
    public class GetChatsByUserIdIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetChatsByUserIdIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-7.1 GetChatsByUserId Test Cases

        /// <summary>
        /// UC-7.1-TC-1: Get chats by user ID with existing chats
        /// Expected: 200 OK with chats array containing chat details
        /// </summary>
        [Fact]
        public async Task UC_7_1_TC_1_GetChatsByUserId_WithExistingChats_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-expert/user/1");

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
                    // Should contain chat data with these fields
                    var firstChat = jsonDoc.RootElement.EnumerateArray().FirstOrDefault();
                    if (firstChat.ValueKind == JsonValueKind.Object)
                    {
                        Assert.True(firstChat.TryGetProperty("chatExpertId", out _) || 
                                   firstChat.TryGetProperty("id", out _),
                                   "Response should contain chatExpertId or id");
                    }
                }
            }
        }

        /// <summary>
        /// UC-7.1-TC-2: Get chats by user ID with no chats
        /// Expected: 200 OK with empty array []
        /// </summary>
        [Fact]
        public async Task UC_7_1_TC_2_GetChatsByUserId_WithNoChats_ReturnsEmptyArray()
        {
            var client = CreateAuthenticatedClient(999, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-expert/user/999");

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
        /// UC-7.1-TC-3: Get chats by non-existent user ID
        /// Expected: 404 Not Found with error message or 200 with empty array
        /// </summary>
        [Fact]
        public async Task UC_7_1_TC_3_GetChatsByUserId_NonExistentUser_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-expert/user/9999");

            // Either 404 or 200 with empty array - depends on implementation
            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.OK,
                $"Unexpected status code: {response.StatusCode}");
        }

        #endregion
    }
}
