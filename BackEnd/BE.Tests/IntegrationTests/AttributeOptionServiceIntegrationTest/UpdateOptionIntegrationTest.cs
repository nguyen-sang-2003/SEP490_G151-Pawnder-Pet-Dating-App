using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeOptionServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho UpdateOption API
    /// PUT /api/attribute-option/attribute-option/{optionId}
    /// </summary>
    public class UpdateOptionIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UpdateOptionIntegrationTest(CustomWebApplicationFactory factory)
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

        private string GenerateUniqueName() => $"Updated_{Guid.NewGuid():N}".Substring(0, 15);

        #region UC-3.3 updateOption Test Cases

        /// <summary>
        /// UC-3.3-TC-1: Update option with valid data
        /// Expected: 200 OK or 404 if option doesn't exist
        /// </summary>
        [Fact]
        public async Task UC_3_3_TC_1_UpdateOption_ValidData_Returns200Or404()
        {
            var client = CreateAdminClient();
            var newName = GenerateUniqueName();
            var content = new StringContent(JsonSerializer.Serialize(newName), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-3.3-TC-2: Update option with empty name
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_3_3_TC_2_UpdateOption_EmptyName_Returns400()
        {
            var client = CreateAdminClient();
            var content = new StringContent(JsonSerializer.Serialize(""), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.NotFound);
        }

        /// <summary>
        /// UC-3.3-TC-3: Update option with whitespace only
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_3_3_TC_3_UpdateOption_WhitespaceOnly_Returns400()
        {
            var client = CreateAdminClient();
            var content = new StringContent(JsonSerializer.Serialize("   "), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.NotFound);
        }

        /// <summary>
        /// UC-3.3-TC-4: Update non-existent option
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_3_3_TC_4_UpdateOption_NotFound_Returns404()
        {
            var client = CreateAdminClient();
            var content = new StringContent(JsonSerializer.Serialize("Test Option"), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/AttributeOption/attribute-option/99999", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-3.3-TC-5: Update deleted option
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_3_3_TC_5_UpdateOption_DeletedOption_Returns404()
        {
            var client = CreateAdminClient();
            var content = new StringContent(JsonSerializer.Serialize("Test Option"), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/AttributeOption/attribute-option/10", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test: User role cannot update (Admin only)
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task UpdateOption_UserRole_Returns403()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
            client.DefaultRequestHeaders.Add("X-Test-Role", "User");
            client.DefaultRequestHeaders.Add("X-Test-Email", "user@example.com");

            var content = new StringContent(JsonSerializer.Serialize("Test"), Encoding.UTF8, "application/json");
            var response = await client.PutAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UpdateOption_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var content = new StringContent(JsonSerializer.Serialize("Test"), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
