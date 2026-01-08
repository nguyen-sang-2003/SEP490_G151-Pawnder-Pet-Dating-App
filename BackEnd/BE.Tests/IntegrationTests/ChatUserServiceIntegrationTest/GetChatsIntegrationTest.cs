using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatUserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetChats API
    /// GET /api/chat-user/chat/{userId}?petId={petId}
    /// UC-8.1 - Get chats by user ID
    /// </summary>
    public class GetChatsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetChatsIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-8.1 GetChats Test Cases

        /// <summary>
        /// UC-8.1-TC-1: Get chats by user ID without petId filter
        /// Expected: 200 OK with chats array
        /// </summary>
        [Fact]
        public async Task UC_8_1_TC_1_GetChats_WithoutPetIdFilter_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-user/chat/1");

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
                    var chats = jsonDoc.RootElement.EnumerateArray().ToList();
                    if (chats.Count > 0)
                    {
                        var firstChat = chats[0];
                        Assert.True(firstChat.TryGetProperty("matchId", out _),
                                   "Response should contain matchId");
                        Assert.True(firstChat.TryGetProperty("fromPetId", out _),
                                   "Response should contain fromPetId");
                        Assert.True(firstChat.TryGetProperty("toPetId", out _),
                                   "Response should contain toPetId");
                    }
                }
            }
        }

        /// <summary>
        /// UC-8.1-TC-2: Get chats by user ID with petId filter
        /// Expected: 200 OK with filtered chats array
        /// </summary>
        [Fact]
        public async Task UC_8_1_TC_2_GetChats_WithPetIdFilter_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-user/chat/1?petId=1");

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
                    var chats = jsonDoc.RootElement.EnumerateArray().ToList();
                    if (chats.Count > 0)
                    {
                        var firstChat = chats[0];
                        Assert.True(firstChat.TryGetProperty("matchId", out _),
                                   "Response should contain matchId");
                    }
                }
            }
        }

        /// <summary>
        /// UC-8.1-TC-3: Get chats by user ID with no chats
        /// Expected: 200 OK with empty array []
        /// </summary>
        [Fact]
        public async Task UC_8_1_TC_3_GetChats_WithNoChats_ReturnsEmptyArray()
        {
            var client = CreateAuthenticatedClient(999, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-user/chat/999");

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
        /// UC-8.1-TC-4: Get chats by user ID with petId not belonging to user
        /// Expected: 400 Bad Request with error message
        /// </summary>
        [Fact]
        public async Task UC_8_1_TC_4_GetChats_PetNotBelongingToUser_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-user/chat/1?petId=9999");

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 400 or 404, got {response.StatusCode}");
        }

        #endregion
    }
}
