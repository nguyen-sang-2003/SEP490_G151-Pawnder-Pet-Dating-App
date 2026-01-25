using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeOptionServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho DeleteOption API
    /// DELETE /api/attribute-option/attribute-option/{optionId}
    /// </summary>
    public class DeleteOptionIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public DeleteOptionIntegrationTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        private HttpClient CreateAdminClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "100");
            client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
            client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
            return client;
        }

        #region UC-3.4 deleteOption Test Cases

        /// <summary>
        /// UC-3.4-TC-1: Delete option with valid ID
        /// Expected: 200 OK or 404 if not found
        /// </summary>
        [Fact]
        public async Task UC_3_4_TC_1_DeleteOption_ValidId_Returns200Or404()
        {
            var client = CreateAdminClient();

            var response = await client.DeleteAsync("/api/AttributeOption/attribute-option/1");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-3.4-TC-2: Delete non-existent option
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_3_4_TC_2_DeleteOption_NotFound_Returns404()
        {
            var client = CreateAdminClient();

            var response = await client.DeleteAsync("/api/AttributeOption/attribute-option/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy option", content);
        }

        /// <summary>
        /// UC-3.4-TC-3: Delete already deleted option
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_3_4_TC_3_DeleteOption_AlreadyDeleted_Returns404()
        {
            var client = CreateAdminClient();

            var response = await client.DeleteAsync("/api/AttributeOption/attribute-option/10");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test: User role cannot delete (Admin only)
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task DeleteOption_UserRole_Returns403()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
            client.DefaultRequestHeaders.Add("X-Test-Role", "User");
            client.DefaultRequestHeaders.Add("X-Test-Email", "user@example.com");

            var response = await client.DeleteAsync("/api/AttributeOption/attribute-option/1");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task DeleteOption_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.DeleteAsync("/api/AttributeOption/attribute-option/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
