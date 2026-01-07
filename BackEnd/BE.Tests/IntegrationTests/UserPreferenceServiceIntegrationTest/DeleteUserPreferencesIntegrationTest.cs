using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.UserPreferenceServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho DeleteUserPreferences API
    /// DELETE /user-preference/{userId}
    /// </summary>
    public class DeleteUserPreferencesIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public DeleteUserPreferencesIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-UP-2.1 DeleteUserPreferences Test Cases

        /// <summary>
        /// UC-UP-2.1-TC-1: Delete user preferences with valid userId
        /// Expected: 200 OK with success message
        /// Note: User 1 has seeded preferences
        /// </summary>
        [Fact]
        public async Task UC_UP_2_1_TC_1_DeleteUserPreferences_ValidUserId_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.DeleteAsync("/user-preference/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đã xóa sở thích của người dùng 1", responseContent);
        }

        /// <summary>
        /// UC-UP-2.1-TC-2: Delete user preferences with non-existent userId
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_UP_2_1_TC_2_DeleteUserPreferences_NonExistentUserId_Returns404()
        {
            var client = CreateAuthenticatedClient(99999, "User", "test@example.com");

            var response = await client.DeleteAsync("/user-preference/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Người dùng không có sở thích nào để xóa", responseContent);
        }

        /// <summary>
        /// UC-UP-2.1-TC-3: Delete user preferences with invalid userId (zero)
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_UP_2_1_TC_3_DeleteUserPreferences_ZeroUserId_Returns404()
        {
            var client = CreateAuthenticatedClient(0, "User", "test@example.com");

            var response = await client.DeleteAsync("/user-preference/0");

            // Zero userId should return 404 (no preferences) or route not matched
            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.BadRequest,
                $"Unexpected status code: {response.StatusCode}");
        }

        /// <summary>
        /// UC-UP-2.1-TC-4: Delete user preferences for user with no preferences
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_UP_2_1_TC_4_DeleteUserPreferences_UserWithNoPreferences_Returns404()
        {
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");

            var response = await client.DeleteAsync("/user-preference/2");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Người dùng không có sở thích nào để xóa", responseContent);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task DeleteUserPreferences_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.DeleteAsync("/user-preference/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
