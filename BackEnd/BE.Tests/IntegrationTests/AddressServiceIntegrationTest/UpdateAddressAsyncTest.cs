using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AddressServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho UpdateAddress API
    /// </summary>
    public class UpdateAddressIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UpdateAddressIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-1.2 Integration Test Cases

        /// <summary>
        /// UC-1.2-TC-2: Update address với addressId không tồn tại
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_1_2_TC_2_UpdateAddress_AddressNotFound_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { Latitude = 10.775843m, Longitude = 106.701755m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/Address/99999", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy địa chỉ", responseContent);
        }

        /// <summary>
        /// UC-1.2-TC-3: Update address với invalid latitude (> 90)
        /// Expected: HTTP 500 (ArgumentException)
        /// </summary>
        [Fact]
        public async Task UC_1_2_TC_3_UpdateAddress_InvalidLatitude_ReturnsError()
        {
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");
            var request = new { Latitude = 91m, Longitude = 106.701755m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/Address/1", content);

            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }

        /// <summary>
        /// UC-1.2-TC-4: Update address với invalid longitude (> 180)
        /// Expected: HTTP 500 (ArgumentException)
        /// </summary>
        [Fact]
        public async Task UC_1_2_TC_4_UpdateAddress_InvalidLongitude_ReturnsError()
        {
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");
            var request = new { Latitude = 10.775843m, Longitude = 181m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/Address/1", content);

            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UpdateAddress_NoAuthToken_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { Latitude = 10.775843m, Longitude = 106.701755m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/Address/1", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
