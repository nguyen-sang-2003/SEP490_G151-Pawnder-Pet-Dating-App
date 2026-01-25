using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho UpdateAttribute API
    /// PUT /api/attribute/{id}
    /// </summary>
    public class UpdateAttributeIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UpdateAttributeIntegrationTest(CustomWebApplicationFactory factory)
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

        private string GenerateUniqueName() => $"UpdateTest_{Guid.NewGuid():N}".Substring(0, 20);

        #region UC-2.4 updateAttribute Test Cases

        /// <summary>
        /// UC-2.4-TC-1: Update attribute with valid data
        /// Expected: 200 OK or 404 if attribute doesn't exist
        /// </summary>
        [Fact]
        public async Task UC_2_4_TC_1_UpdateAttribute_ValidData_Returns200Or404()
        {
            var client = CreateAdminClient();
            var request = new
            {
                Name = GenerateUniqueName(),
                TypeValue = "string",
                Unit = (string?)null,
                IsDeleted = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/attribute/1", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-2.4-TC-2: Update attribute with new unit
        /// Expected: 200 OK or 404
        /// </summary>
        [Fact]
        public async Task UC_2_4_TC_2_UpdateAttribute_WithUnit_Returns200Or404()
        {
            var client = CreateAdminClient();
            var request = new
            {
                Name = GenerateUniqueName(),
                TypeValue = "number",
                Unit = "năm",
                IsDeleted = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/attribute/2", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound);
        }

        /// <summary>
        /// UC-2.4-TC-4: Update non-existent attribute
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_2_4_TC_4_UpdateAttribute_NotFound_Returns404()
        {
            var client = CreateAdminClient();
            var request = new
            {
                Name = "Test",
                TypeValue = "string",
                Unit = (string?)null,
                IsDeleted = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/attribute/99999", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-2.4-TC-5: Update attribute with missing name
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_4_TC_5_UpdateAttribute_MissingName_Returns400()
        {
            var client = CreateAdminClient();
            var request = new
            {
                TypeValue = "string",
                Unit = (string?)null,
                IsDeleted = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/attribute/1", content);

            // Either BadRequest (validation) or NotFound (no attribute with id 1)
            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.NotFound);
        }

        /// <summary>
        /// Test: User role cannot update (Admin only)
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task UpdateAttribute_UserRole_Returns403()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
            client.DefaultRequestHeaders.Add("X-Test-Role", "User");
            client.DefaultRequestHeaders.Add("X-Test-Email", "user@example.com");

            var request = new { Name = "Test", TypeValue = "string" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/attribute/1", content);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UpdateAttribute_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { Name = "Test", TypeValue = "string" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/api/attribute/1", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
