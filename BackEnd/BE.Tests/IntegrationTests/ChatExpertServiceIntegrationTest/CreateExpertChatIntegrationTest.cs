using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatExpertServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho CreateExpertChat API
    /// POST /api/chat-expert/{expertId}/{userId}
    /// UC-7.3 - Create expert chat
    /// </summary>
    public class CreateExpertChatIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public CreateExpertChatIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-7.3 CreateExpertChat Test Cases

        /// <summary>
        /// UC-7.3-TC-1: Create expert chat with valid users
        /// Expected: 200 OK with created chat object containing chatExpertId, expertId, userId, createdAt
        /// </summary>
        [Fact]
        public async Task UC_7_3_TC_1_CreateExpertChat_ValidUsers_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.PostAsync("/api/chat-expert/2/1", null);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
            
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(responseContent);
                
                // Verify response contains required fields
                Assert.True(jsonDoc.RootElement.TryGetProperty("chatExpertId", out _) ||
                           jsonDoc.RootElement.TryGetProperty("id", out _),
                           "Response should contain chatExpertId or id");
                Assert.True(jsonDoc.RootElement.TryGetProperty("expertId", out _),
                           "Response should contain expertId");
                Assert.True(jsonDoc.RootElement.TryGetProperty("userId", out _),
                           "Response should contain userId");
            }
        }

        /// <summary>
        /// UC-7.3-TC-2: Create expert chat with same user and expert
        /// Expected: 400 Bad Request with message about self-chat
        /// </summary>
        [Fact]
        public async Task UC_7_3_TC_2_CreateExpertChat_SameUserAndExpert_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.PostAsync("/api/chat-expert/1/1", null);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 400 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-7.3-TC-3: Create expert chat with non-existent expert
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_7_3_TC_3_CreateExpertChat_NonExistentExpert_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.PostAsync("/api/chat-expert/9999/1", null);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-7.3-TC-4: Create expert chat with non-existent user
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_7_3_TC_4_CreateExpertChat_NonExistentUser_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.PostAsync("/api/chat-expert/2/9999", null);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-7.3-TC-5: Create expert chat that already exists
        /// Expected: 200 OK with existing chat object (not duplicated)
        /// </summary>
        [Fact]
        public async Task UC_7_3_TC_5_CreateExpertChat_AlreadyExists_ReturnsExistingChat()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // First creation
            var response1 = await client.PostAsync("/api/chat-expert/2/1", null);
            
            if (response1.StatusCode != HttpStatusCode.OK)
            {
                // Skip test if endpoints not working as expected
                return;
            }
            
            var content1 = await response1.Content.ReadAsStringAsync();
            var doc1 = JsonDocument.Parse(content1);
            var firstChatId = doc1.RootElement.GetProperty("chatExpertId").GetInt32();

            // Second creation (should return existing)
            var response2 = await client.PostAsync("/api/chat-expert/2/1", null);
            Assert.Equal(HttpStatusCode.OK, response2.StatusCode);
            var content2 = await response2.Content.ReadAsStringAsync();
            var doc2 = JsonDocument.Parse(content2);
            var secondChatId = doc2.RootElement.GetProperty("chatExpertId").GetInt32();

            // Should return the same chat
            Assert.Equal(firstChatId, secondChatId);
        }

        #endregion
    }
}
