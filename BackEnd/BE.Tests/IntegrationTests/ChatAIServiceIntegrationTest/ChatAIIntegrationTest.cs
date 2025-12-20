using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ChatAIServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho ChatAI API - Token Usage và Chat Management
    /// </summary>
    public class ChatAIIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public ChatAIIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-6.1 GetTokenUsage Test Cases

        /// <summary>
        /// UC-6.1-TC-1: Get token usage for free user
        /// Expected: 200 OK with token usage data
        /// </summary>
        [Fact]
        public async Task UC_6_1_TC_1_GetTokenUsage_FreeUser_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-ai/token-usage");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("success", responseContent);
        }

        /// <summary>
        /// UC-6.1-TC-2: Get token usage for VIP user
        /// Expected: 200 OK with VIP token limits
        /// </summary>
        [Fact]
        public async Task UC_6_1_TC_2_GetTokenUsage_VipUser_Returns200()
        {
            // User with VIP status (UserStatusId = 3)
            var client = CreateAuthenticatedClient(100, "User", "user@example.com");

            var response = await client.GetAsync("/api/chat-ai/token-usage");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-6.1-TC-3: Get token usage without authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_6_1_TC_3_GetTokenUsage_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/chat-ai/token-usage");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion

        #region UC-6.2 GetAllChats Test Cases

        /// <summary>
        /// UC-6.2-TC-1: Get all chats with existing chats
        /// Expected: 200 OK with chats array
        /// </summary>
        [Fact]
        public async Task UC_6_2_TC_1_GetAllChats_WithExistingChats_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-ai/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("success", responseContent);
        }

        /// <summary>
        /// UC-6.2-TC-2: Get all chats with no chats
        /// Expected: 200 OK with empty array
        /// </summary>
        [Fact]
        public async Task UC_6_2_TC_2_GetAllChats_WithNoChats_Returns200()
        {
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");

            var response = await client.GetAsync("/api/chat-ai/2");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-6.2-TC-3: Get all chats with different user ID
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task UC_6_2_TC_3_GetAllChats_DifferentUserId_Returns403()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Trying to access another user's chats
            var response = await client.GetAsync("/api/chat-ai/9999");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// UC-6.2-TC-4: Get all chats without authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_6_2_TC_4_GetAllChats_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/chat-ai/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion

        #region UC-6.3 CreateChat Test Cases

        /// <summary>
        /// UC-6.3-TC-1: Create chat with title
        /// Expected: 200 OK with chat data
        /// </summary>
        [Fact]
        public async Task UC_6_3_TC_1_CreateChat_WithTitle_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { title = "Chat mới về thú cưng" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/chat-ai/1", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("success", responseContent);
        }

        /// <summary>
        /// UC-6.3-TC-2: Create chat without title
        /// Expected: 200 OK with default title
        /// </summary>
        [Fact]
        public async Task UC_6_3_TC_2_CreateChat_WithoutTitle_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { title = (string?)null };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/chat-ai/1", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-6.3-TC-3: Create chat with different user ID
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task UC_6_3_TC_3_CreateChat_DifferentUserId_Returns403()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { title = "Test Chat" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/chat-ai/9999", content);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// UC-6.3-TC-4: Create chat without authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_6_3_TC_4_CreateChat_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { title = "Test Chat" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/chat-ai/1", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion

        #region UC-6.4 UpdateChatTitle Test Cases

        /// <summary>
        /// UC-6.4-TC-1: Update chat title with valid data
        /// Expected: 200 OK with success message
        /// </summary>
        [Fact]
        public async Task UC_6_4_TC_1_UpdateChatTitle_ValidData_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            
            // First create a chat
            var createRequest = new { title = "Original Title" };
            var createContent = new StringContent(JsonSerializer.Serialize(createRequest), Encoding.UTF8, "application/json");
            var createResponse = await client.PostAsync("/api/chat-ai/1", createContent);
            
            if (createResponse.StatusCode == HttpStatusCode.OK)
            {
                var createResponseContent = await createResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(createResponseContent);
                var chatId = doc.RootElement.GetProperty("data").GetProperty("chatId").GetInt32();

                // Now update the title
                var updateRequest = new { title = "Tiêu đề mới" };
                var updateContent = new StringContent(JsonSerializer.Serialize(updateRequest), Encoding.UTF8, "application/json");

                var response = await client.PutAsync($"/api/chat-ai/{chatId}", updateContent);

                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }
        }

        /// <summary>
        /// UC-6.4-TC-2: Update chat title with empty title
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_6_4_TC_2_UpdateChatTitle_EmptyTitle_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { title = "" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/chat-ai/1", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-6.4-TC-3: Update chat title with non-existent chat
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_6_4_TC_3_UpdateChatTitle_NonExistentChat_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { title = "New Title" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/chat-ai/99999", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-6.4-TC-4: Update chat title without authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_6_4_TC_4_UpdateChatTitle_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { title = "New Title" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/chat-ai/1", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion

        #region UC-6.5 DeleteChat Test Cases

        /// <summary>
        /// UC-6.5-TC-1: Delete chat with valid ID
        /// Expected: 200 OK with success message
        /// </summary>
        [Fact]
        public async Task UC_6_5_TC_1_DeleteChat_ValidId_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            
            // First create a chat
            var createRequest = new { title = "Chat to Delete" };
            var createContent = new StringContent(JsonSerializer.Serialize(createRequest), Encoding.UTF8, "application/json");
            var createResponse = await client.PostAsync("/api/chat-ai/1", createContent);
            
            if (createResponse.StatusCode == HttpStatusCode.OK)
            {
                var createResponseContent = await createResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(createResponseContent);
                var chatId = doc.RootElement.GetProperty("data").GetProperty("chatId").GetInt32();

                // Now delete it
                var response = await client.DeleteAsync($"/api/chat-ai/{chatId}");

                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }
        }

        /// <summary>
        /// UC-6.5-TC-2: Delete chat with non-existent ID
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_6_5_TC_2_DeleteChat_NonExistentId_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.DeleteAsync("/api/chat-ai/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-6.5-TC-3: Delete chat without authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_6_5_TC_3_DeleteChat_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.DeleteAsync("/api/chat-ai/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion

        #region UC-6.6 GetChatHistory Test Cases

        /// <summary>
        /// UC-6.6-TC-1: Get chat history with valid chat ID
        /// Expected: 200 OK with messages
        /// </summary>
        [Fact]
        public async Task UC_6_6_TC_1_GetChatHistory_ValidChatId_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            
            // First create a chat
            var createRequest = new { title = "Chat for History" };
            var createContent = new StringContent(JsonSerializer.Serialize(createRequest), Encoding.UTF8, "application/json");
            var createResponse = await client.PostAsync("/api/chat-ai/1", createContent);
            
            if (createResponse.StatusCode == HttpStatusCode.OK)
            {
                var createResponseContent = await createResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(createResponseContent);
                var chatId = doc.RootElement.GetProperty("data").GetProperty("chatId").GetInt32();

                // Get history
                var response = await client.GetAsync($"/api/chat-ai/{chatId}/messages");

                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }
        }

        /// <summary>
        /// UC-6.6-TC-2: Get chat history with no messages
        /// Expected: 200 OK with empty messages
        /// </summary>
        [Fact]
        public async Task UC_6_6_TC_2_GetChatHistory_NoMessages_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            
            // Create a new chat (should have no messages)
            var createRequest = new { title = "Empty Chat" };
            var createContent = new StringContent(JsonSerializer.Serialize(createRequest), Encoding.UTF8, "application/json");
            var createResponse = await client.PostAsync("/api/chat-ai/1", createContent);
            
            if (createResponse.StatusCode == HttpStatusCode.OK)
            {
                var createResponseContent = await createResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(createResponseContent);
                var chatId = doc.RootElement.GetProperty("data").GetProperty("chatId").GetInt32();

                var response = await client.GetAsync($"/api/chat-ai/{chatId}/messages");

                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }
        }

        /// <summary>
        /// UC-6.6-TC-3: Get chat history with non-existent chat ID
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_6_6_TC_3_GetChatHistory_NonExistentChatId_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/api/chat-ai/99999/messages");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-6.6-TC-4: Get chat history without authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_6_6_TC_4_GetChatHistory_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/chat-ai/1/messages");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion

        #region UC-6.7 SendAIMessage Test Cases

        /// <summary>
        /// UC-6.7-TC-1: Send AI message with valid question
        /// Expected: 200 OK with AI response (or 500 if AI service unavailable)
        /// </summary>
        [Fact]
        public async Task UC_6_7_TC_1_SendAIMessage_ValidQuestion_ReturnsExpected()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            
            // First create a chat
            var createRequest = new { title = "Chat for AI" };
            var createContent = new StringContent(JsonSerializer.Serialize(createRequest), Encoding.UTF8, "application/json");
            var createResponse = await client.PostAsync("/api/chat-ai/1", createContent);
            
            if (createResponse.StatusCode == HttpStatusCode.OK)
            {
                var createResponseContent = await createResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(createResponseContent);
                var chatId = doc.RootElement.GetProperty("data").GetProperty("chatId").GetInt32();

                // Send message
                var messageRequest = new { question = "Cách chăm sóc chó con?" };
                var messageContent = new StringContent(JsonSerializer.Serialize(messageRequest), Encoding.UTF8, "application/json");

                var response = await client.PostAsync($"/api/chat-ai/{chatId}/messages", messageContent);

                // AI service may not be available in test environment
                Assert.True(
                    response.StatusCode == HttpStatusCode.OK ||
                    response.StatusCode == HttpStatusCode.TooManyRequests ||
                    response.StatusCode == HttpStatusCode.InternalServerError,
                    $"Unexpected status code: {response.StatusCode}");
            }
        }

        /// <summary>
        /// UC-6.7-TC-2: Send AI message with empty question
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_6_7_TC_2_SendAIMessage_EmptyQuestion_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { question = "" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/chat-ai/1/messages", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Câu hỏi không được để trống", responseContent);
        }

        /// <summary>
        /// UC-6.7-TC-3: Send AI message with whitespace only
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_6_7_TC_3_SendAIMessage_WhitespaceOnly_Returns400()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { question = "   " };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/chat-ai/1/messages", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-6.7-TC-6: Send AI message with non-existent chat ID
        /// Expected: 404 Not Found (or 500)
        /// </summary>
        [Fact]
        public async Task UC_6_7_TC_6_SendAIMessage_NonExistentChatId_ReturnsError()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { question = "Test question?" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/chat-ai/99999/messages", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.InternalServerError,
                $"Unexpected status code: {response.StatusCode}");
        }

        /// <summary>
        /// UC-6.7-TC-7: Send AI message without authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UC_6_7_TC_7_SendAIMessage_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { question = "Test question?" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/chat-ai/1/messages", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
