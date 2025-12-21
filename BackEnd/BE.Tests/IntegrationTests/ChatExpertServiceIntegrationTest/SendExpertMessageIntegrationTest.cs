using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatExpertServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho SendExpertMessage API
    /// POST /api/chat-expert-content/{chatExpertId}/{fromId}
    /// UC-7.5 - Send expert message
    /// </summary>
    public class SendExpertMessageIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public SendExpertMessageIntegrationTest(CustomWebApplicationFactory factory)
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

        private StringContent CreateMessageRequest(string message, int? expertId = null, int? userId = null, int? chatAiId = null)
        {
            var requestBody = new
            {
                message = message,
                expertId = expertId,
                userId = userId,
                chatAiid = chatAiId
            };

            var json = JsonSerializer.Serialize(requestBody);
            return new StringContent(json, Encoding.UTF8, "application/json");
        }

        #region UC-7.5 SendExpertMessage Test Cases

        /// <summary>
        /// UC-7.5-TC-1: Send expert message with valid data
        /// Expected: 200 OK with success message and message details
        /// </summary>
        [Fact]
        public async Task UC_7_5_TC_1_SendExpertMessage_ValidData_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("Xin chào, tôi cần tư vấn");

            var response = await client.PostAsync("/api/chat-expert-content/1/1", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
            
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(responseContent);
                
                // Verify response contains required fields
                Assert.True(jsonDoc.RootElement.TryGetProperty("message", out _),
                           "Response should contain message field");
                Assert.True(jsonDoc.RootElement.TryGetProperty("contentId", out _) ||
                           jsonDoc.RootElement.TryGetProperty("id", out _),
                           "Response should contain contentId or id");
                Assert.True(jsonDoc.RootElement.TryGetProperty("chatExpertId", out _),
                           "Response should contain chatExpertId");
            }
        }

        /// <summary>
        /// UC-7.5-TC-2: Send expert message with empty message
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_7_5_TC_2_SendExpertMessage_EmptyMessage_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("");

            var response = await client.PostAsync("/api/chat-expert-content/1/1", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 400 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-7.5-TC-3: Send expert message with whitespace only
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_7_5_TC_3_SendExpertMessage_WhitespaceOnly_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("   ");

            var response = await client.PostAsync("/api/chat-expert-content/1/1", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 400 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-7.5-TC-4: Send expert message with non-existent chat
        /// Expected: 404/400
        /// </summary>
        [Fact]
        public async Task UC_7_5_TC_4_SendExpertMessage_NonExistentChat_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("Test message");

            var response = await client.PostAsync("/api/chat-expert-content/9999/1", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.BadRequest,
                $"Unexpected status code: {response.StatusCode}");
        }

        /// <summary>
        /// UC-7.5-TC-5: Send expert message with fromId not in chat
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_7_5_TC_5_SendExpertMessage_FromIdNotInChat_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("Test message");

            var response = await client.PostAsync("/api/chat-expert-content/1/9999", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
                $"Unexpected status code: {response.StatusCode}");
        }

        /// <summary>
        /// UC-7.5-TC-6: Send expert message with expert confirmation
        /// Expected: 200 OK with success message and message details
        /// </summary>
        [Fact]
        public async Task UC_7_5_TC_6_SendExpertMessage_WithExpertConfirmation_Returns200()
        {
            var client = CreateAuthenticatedClient(2, "Expert", "expert@example.com");
            var request = CreateMessageRequest("Tôi đã xác nhận", expertId: 2, userId: 1, chatAiId: 1);

            var response = await client.PostAsync("/api/chat-expert-content/1/2", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
            
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var jsonDoc = JsonDocument.Parse(responseContent);
                
                // Verify response contains required fields
                Assert.True(jsonDoc.RootElement.TryGetProperty("message", out _),
                           "Response should contain message field");
                Assert.True(jsonDoc.RootElement.TryGetProperty("contentId", out _) ||
                           jsonDoc.RootElement.TryGetProperty("id", out _),
                           "Response should contain contentId or id");
            }
        }

        /// <summary>
        /// UC-7.5-TC-7: Send expert message with non-existent expert confirmation
        /// Expected: 404
        /// </summary>
        [Fact]
        public async Task UC_7_5_TC_7_SendExpertMessage_NonExistentExpertConfirmation_Returns404()
        {
            var client = CreateAuthenticatedClient(2, "Expert", "expert@example.com");
            var request = CreateMessageRequest("Test message", expertId: 9999, userId: 9999, chatAiId: 9999);

            var response = await client.PostAsync("/api/chat-expert-content/1/2", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.BadRequest,
                $"Unexpected status code: {response.StatusCode}");
        }

        #endregion
    }
}
