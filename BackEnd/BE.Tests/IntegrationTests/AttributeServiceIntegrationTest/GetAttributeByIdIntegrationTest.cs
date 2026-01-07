using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetAttributeById API
    /// GET /api/attribute/{id}
    /// </summary>
    public class GetAttributeByIdIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetAttributeByIdIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-2.3 getAttributeById Test Cases

        /// <summary>
        /// UC-2.3-TC-1: Get attribute by valid ID
        /// Expected: 200 OK or 404 if no attributes seeded
        /// </summary>
        [Fact]
        public async Task UC_2_3_TC_1_GetAttributeById_ValidId_Returns200Or404()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/attribute/1");

            // Either OK (if attribute exists) or NotFound (if not seeded)
            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.NotFound,
                $"Expected 200 or 404, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-2.3-TC-2: Get attribute by non-existent ID
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_2_3_TC_2_GetAttributeById_NotFound_Returns404()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/attribute/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy thuộc tính", content);
        }

        /// <summary>
        /// UC-2.3-TC-3: Get attribute with negative ID
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_2_3_TC_3_GetAttributeById_NegativeId_Returns404()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/attribute/-1");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetAttributeById_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/attribute/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
