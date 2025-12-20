using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AddressServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho GetAddressById API
    /// </summary>
    public class GetAddressByIdIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetAddressByIdIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-1.3 Integration Test Cases

        /// <summary>
        /// UC-1.3-TC-1: Get address với addressId hợp lệ
        /// Expected: HTTP 200 OK với Address data
        /// </summary>
        [Fact]
        public async Task UC_1_3_TC_1_GetAddressById_ValidId_Returns200()
        {
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");

            var response = await client.GetAsync("/Address/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("123 Đường ABC", responseContent);
        }

        /// <summary>
        /// UC-1.3-TC-2: Get address với addressId không tồn tại
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_1_3_TC_2_GetAddressById_NotFound_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/Address/99999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy địa chỉ", responseContent);
        }

        /// <summary>
        /// UC-1.3-TC-3: Get address với negative addressId
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_1_3_TC_3_GetAddressById_NegativeId_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/Address/-1");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-1.3-TC-4: Get address với zero addressId
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_1_3_TC_4_GetAddressById_ZeroId_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            var response = await client.GetAsync("/Address/0");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetAddressById_NoAuthToken_Returns401()
        {
            var client = _factory.CreateClient();

            var response = await client.GetAsync("/Address/1");

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
