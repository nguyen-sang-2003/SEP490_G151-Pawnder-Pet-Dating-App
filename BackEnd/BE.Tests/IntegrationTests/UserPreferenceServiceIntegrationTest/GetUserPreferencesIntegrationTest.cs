using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.UserPreferenceServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetUserPreferences API
    /// GET /user-preference/{userId}
    /// </summary>
    public class GetUserPreferencesIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetUserPreferencesIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-UP-1.1 GetUserPreferences Test Cases

        /// <summary>
        /// UC-UP-1.1-TC-1: Get user preferences with valid userId
        /// Expected: 200 OK with preferences data
        /// </summary>
        [Fact]
        public async Task UC_UP_1_1_TC_1_GetUserPreferences_ValidUserId_Returns200()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/user-preference/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy sở thích thành công", responseContent);
            Assert.Contains("data", responseContent);
        }

        /// <summary>
        /// UC-UP-1.1-TC-2: Get user preferences with non-existent userId
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_UP_1_1_TC_2_GetUserPreferences_NonExistentUserId_Returns404()
        {
            var client = CreateAuthenticatedClient(99999, "User", "test@example.com");

            var response = await client.GetAsync("/user-preference/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-UP-1.1-TC-3: Get user preferences with invalid userId (negative)
        /// Expected: 404 Not Found (route constraint may not match negative)
        /// </summary>
        [Fact]
        public async Task UC_UP_1_1_TC_3_GetUserPreferences_NegativeUserId_ReturnsError()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/user-preference/-1");

            // Negative userId might not match the route constraint or return 404
            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.BadRequest,
                $"Unexpected status code: {response.StatusCode}");
        }

        /// <summary>
        /// UC-UP-1.1-TC-4: Get user preferences for user with no preferences
        /// Expected: 200 OK with empty data array
        /// </summary>
        [Fact]
        public async Task UC_UP_1_1_TC_4_GetUserPreferences_UserWithNoPreferences_Returns200WithEmptyData()
        {
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");

            var response = await client.GetAsync("/user-preference/2");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy sở thích thành công", responseContent);
            Assert.Contains("[]", responseContent); // Empty array
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetUserPreferences_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/user-preference/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
