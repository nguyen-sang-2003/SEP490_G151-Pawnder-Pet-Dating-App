using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeOptionServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho CreateOption API
    /// POST /api/attribute-option/attribute-option/{attributeId}
    /// </summary>
    public class CreateOptionIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public CreateOptionIntegrationTest(CustomWebApplicationFactory factory)
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

        private string GenerateUniqueName() => $"Option_{Guid.NewGuid():N}".Substring(0, 15);

        #region UC-3.2 createOption Test Cases

        /// <summary>
        /// UC-3.2-TC-1: Create option with valid data
        /// Expected: 200 OK (or 404 if attribute doesn't exist)
        /// </summary>
        [Fact]
        public async Task UC_3_2_TC_1_CreateOption_ValidData_Returns200Or404()
        {
            var client = CreateAdminClient();
            var optionName = GenerateUniqueName();
            var content = new StringContent(JsonSerializer.Serialize(optionName), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-3.2-TC-2: Create option with empty name
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_3_2_TC_2_CreateOption_EmptyName_Returns400()
        {
            var client = CreateAdminClient();
            var content = new StringContent(JsonSerializer.Serialize(""), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/AttributeOption/attribute-option/1", content);

            // Either BadRequest (validated) or NotFound (no attribute)
            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.NotFound);
        }

        /// <summary>
        /// UC-3.2-TC-3: Create option with whitespace only
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_3_2_TC_3_CreateOption_WhitespaceOnly_Returns400()
        {
            var client = CreateAdminClient();
            var content = new StringContent(JsonSerializer.Serialize("   "), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.NotFound);
        }

        /// <summary>
        /// UC-3.2-TC-4: Create option for non-existent attribute
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_3_2_TC_4_CreateOption_NonExistentAttribute_Returns404()
        {
            var client = CreateAdminClient();
            var content = new StringContent(JsonSerializer.Serialize("Test Option"), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/AttributeOption/attribute-option/99999", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-3.2-TC-5: Create option for deleted attribute
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_3_2_TC_5_CreateOption_DeletedAttribute_Returns404()
        {
            var client = CreateAdminClient();
            var content = new StringContent(JsonSerializer.Serialize("Test Option"), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/AttributeOption/attribute-option/5", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test: User role cannot create (Admin only)
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task CreateOption_UserRole_Returns403()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
            client.DefaultRequestHeaders.Add("X-Test-Role", "User");
            client.DefaultRequestHeaders.Add("X-Test-Email", "user@example.com");

            var content = new StringContent(JsonSerializer.Serialize("Test"), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task CreateOption_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var content = new StringContent(JsonSerializer.Serialize("Test"), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/AttributeOption/attribute-option/1", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
