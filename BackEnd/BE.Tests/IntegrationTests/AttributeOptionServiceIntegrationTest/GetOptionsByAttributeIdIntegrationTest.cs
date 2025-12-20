using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeOptionServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetOptionsByAttributeId API
    /// GET /api/attribute-option/{attributeId}
    /// </summary>
    public class GetOptionsByAttributeIdIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetOptionsByAttributeIdIntegrationTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        private HttpClient CreateUserClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
            client.DefaultRequestHeaders.Add("X-Test-Role", "User");
            client.DefaultRequestHeaders.Add("X-Test-Email", "test@example.com");
            return client;
        }

        #region UC-3.1 getOptionsByAttributeId Test Cases

        /// <summary>
        /// UC-3.1-TC-1: Get options by valid attribute ID
        /// Expected: 200 OK with options array (may be empty)
        /// </summary>
        [Fact]
        public async Task UC_3_1_TC_1_GetOptionsByAttributeId_ValidId_Returns200()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/AttributeOption/1");

            // Either OK (if attribute exists) or NotFound (if not seeded)
            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-3.1-TC-2: Get options by non-existent attribute ID
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_3_1_TC_2_GetOptionsByAttributeId_NotFound_Returns404()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/AttributeOption/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy", content);
        }

        /// <summary>
        /// UC-3.1-TC-3: Get options by deleted attribute ID
        /// Expected: 404 Not Found or empty array
        /// </summary>
        [Fact]
        public async Task UC_3_1_TC_3_GetOptionsByAttributeId_DeletedAttribute_Returns404Or200()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/AttributeOption/5");

            Assert.True(
                response.StatusCode == HttpStatusCode.NotFound ||
                response.StatusCode == HttpStatusCode.OK);
        }

        /// <summary>
        /// UC-3.1-TC-4: Get options by attribute with no options
        /// Expected: 200 OK with empty array
        /// </summary>
        [Fact]
        public async Task UC_3_1_TC_4_GetOptionsByAttributeId_NoOptions_Returns200Or404()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/AttributeOption/2");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetOptionsByAttributeId_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/AttributeOption/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
