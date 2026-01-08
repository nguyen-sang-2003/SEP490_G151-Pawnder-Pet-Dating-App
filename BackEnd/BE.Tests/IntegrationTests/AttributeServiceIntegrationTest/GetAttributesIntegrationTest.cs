using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetAttributes API
    /// GET /api/attribute
    /// </summary>
    public class GetAttributesIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetAttributesIntegrationTest(CustomWebApplicationFactory factory)
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

        private HttpClient CreateAdminClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "100");
            client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
            client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
            return client;
        }

        #region UC-2.1 getAttributes Test Cases

        /// <summary>
        /// UC-2.1-TC-1: Get attributes with default pagination
        /// Expected: 200 OK with attributes list
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_1_GetAttributes_DefaultPagination_Returns200()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/attribute?page=1&pageSize=20&includeDeleted=false");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy danh sách thuộc tính thành công", content);
        }

        /// <summary>
        /// UC-2.1-TC-2: Get attributes with search query
        /// Expected: 200 OK with filtered results
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_2_GetAttributes_WithSearch_Returns200()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/attribute?search=test&page=1&pageSize=20&includeDeleted=false");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy danh sách thuộc tính thành công", content);
        }

        /// <summary>
        /// UC-2.1-TC-3: Get attributes with includeDeleted=true
        /// Expected: 200 OK including deleted items
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_3_GetAttributes_IncludeDeleted_Returns200()
        {
            var client = CreateAdminClient();

            var response = await client.GetAsync("/api/attribute?page=1&pageSize=20&includeDeleted=true");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy danh sách thuộc tính thành công", content);
        }

        /// <summary>
        /// UC-2.1-TC-4: Get attributes with invalid pagination
        /// Expected: 400 Bad Request or handled gracefully
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_4_GetAttributes_InvalidPagination_Returns400Or200()
        {
            var client = CreateUserClient();

            var response = await client.GetAsync("/api/attribute?page=0&pageSize=-1&includeDeleted=false");

            // Either BadRequest (validated) or OK with empty/default results
            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.OK,
                $"Expected 400 or 200, got {response.StatusCode}");
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetAttributes_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/attribute?page=1&pageSize=20");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
