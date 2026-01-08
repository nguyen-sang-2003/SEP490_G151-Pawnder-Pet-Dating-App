using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho DeleteAttribute API
    /// DELETE /api/attribute/{id}
    /// </summary>
    public class DeleteAttributeIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public DeleteAttributeIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-2.5 deleteAttribute Test Cases

        /// <summary>
        /// UC-2.5-TC-1: Delete attribute with soft delete
        /// Expected: 200 OK or 404 if not found
        /// </summary>
        [Fact]
        public async Task UC_2_5_TC_1_DeleteAttribute_SoftDelete_Returns200Or404()
        {
            var client = CreateAdminClient();

            var response = await client.DeleteAsync("/api/attribute/1?hard=false");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-2.5-TC-2: Delete attribute with hard delete
        /// Expected: 200 OK or 404 if not found
        /// </summary>
        [Fact]
        public async Task UC_2_5_TC_2_DeleteAttribute_HardDelete_Returns200Or404()
        {
            var client = CreateAdminClient();

            var response = await client.DeleteAsync("/api/attribute/1?hard=true");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound);
        }

        /// <summary>
        /// UC-2.5-TC-3: Delete non-existent attribute
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_2_5_TC_3_DeleteAttribute_NotFound_Returns404()
        {
            var client = CreateAdminClient();

            var response = await client.DeleteAsync("/api/attribute/99999?hard=false");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test: User role cannot delete (Admin only)
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task DeleteAttribute_UserRole_Returns403()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
            client.DefaultRequestHeaders.Add("X-Test-Role", "User");
            client.DefaultRequestHeaders.Add("X-Test-Email", "user@example.com");

            var response = await client.DeleteAsync("/api/attribute/1?hard=false");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task DeleteAttribute_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.DeleteAsync("/api/attribute/1?hard=false");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
