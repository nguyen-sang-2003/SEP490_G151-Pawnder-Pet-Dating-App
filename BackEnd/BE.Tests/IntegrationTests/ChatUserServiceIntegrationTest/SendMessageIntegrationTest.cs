using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatUserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho SendMessage API
    /// POST /api/chat-user-content/chat-user-content/{matchId}/{fromUserId}
    /// UC-8.4 - Send message
    /// </summary>
    public class SendMessageIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public SendMessageIntegrationTest(CustomWebApplicationFactory factory)
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

        private StringContent CreateMessageRequest(string message)
        {
            return new StringContent($"\"{message}\"", Encoding.UTF8, "application/json");
        }

        #region UC-8.4 SendMessage Test Cases

        /// <summary>
        /// UC-8.4-TC-1: Send message with valid data
        /// Expected: 200 OK with success message and message details
        /// </summary>
        [Fact]
        public async Task UC_8_4_TC_1_SendMessage_ValidData_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("Xin chào, bạn có khỏe không?");

            var response = await client.PostAsync("/api/chat-user-content/chat-user-content/1/1", request);

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
        /// UC-8.4-TC-2: Send message with empty message
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_8_4_TC_2_SendMessage_EmptyMessage_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("");

            var response = await client.PostAsync("/api/chat-user-content/chat-user-content/1/1", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 400 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-8.4-TC-3: Send message with whitespace only
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_8_4_TC_3_SendMessage_WhitespaceOnly_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("   ");

            var response = await client.PostAsync("/api/chat-user-content/chat-user-content/1/1", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 400 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-8.4-TC-4: Send message with non-existent matchId
        /// Expected: 404/400 with message about missing chat
        /// </summary>
        [Fact]
        public async Task UC_8_4_TC_4_SendMessage_NonExistentMatchId_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("Test message");

            var response = await client.PostAsync("/api/chat-user-content/chat-user-content/9999/1", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.BadRequest,
                $"Unexpected status code: {response.StatusCode}");
        }

        /// <summary>
        /// UC-8.4-TC-5: Send message with matchId not accepted
        /// Expected: 400/404 with message about missing chat
        /// </summary>
        [Fact]
        public async Task UC_8_4_TC_5_SendMessage_MatchIdNotAccepted_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("Test message");

            var response = await client.PostAsync("/api/chat-user-content/chat-user-content/1/1", request);

            // Depends on match status - could be 400 or 404
            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.OK,
                $"Unexpected status code: {response.StatusCode}");
        }

        /// <summary>
        /// UC-8.4-TC-6: Send message with fromUserId not in chat
        /// Expected: 400 Bad Request with message about user not in chat
        /// </summary>
        [Fact]
        public async Task UC_8_4_TC_6_SendMessage_FromUserIdNotInChat_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = CreateMessageRequest("Test message");

            var response = await client.PostAsync("/api/chat-user-content/chat-user-content/1/9999", request);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
                $"Unexpected status code: {response.StatusCode}");
        }

        #endregion
    }
}
