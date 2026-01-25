using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetAttributesForFilter API
    /// GET /api/attribute/for-filter
    /// </summary>
    public class GetAttributesForFilterIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetAttributesForFilterIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-2.6 getAttributesForFilter Test Cases

        /// <summary>
        /// UC-2.6-TC-1: Get attributes for filter successfully
        /// Expected: 200 OK with filter data
        /// </summary>
        [Fact]
        public async Task UC_2_6_TC_1_GetAttributesForFilter_Success_Returns200()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/attribute/for-filter");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-2.6-TC-2: Get attributes for filter with no data
        /// Expected: 200 OK with empty list
        /// </summary>
        [Fact]
        public async Task UC_2_6_TC_2_GetAttributesForFilter_EmptyData_Returns200()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/attribute/for-filter");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            // Content may be empty or have empty data array
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetAttributesForFilter_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/attribute/for-filter");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
