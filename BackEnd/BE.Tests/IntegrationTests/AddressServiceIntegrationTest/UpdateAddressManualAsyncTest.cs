using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AddressServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho UpdateAddressManual API (PATCH)
    /// </summary>
    public class UpdateAddressManualIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UpdateAddressManualIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-1.4 Integration Test Cases

        /// <summary>
        /// UC-1.4-TC-1: Update manual với tất cả fields
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_1_4_TC_1_UpdateAddressManual_AllFields_Returns200()
        {
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");
            var request = new { City = "Hà Nội", District = "Quận Hoàn Kiếm", Ward = "Phường Tràng Tiền" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PatchAsync("/Address/1/manual", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật địa chỉ thành công", responseContent);
        }

        /// <summary>
        /// UC-1.4-TC-2: Update manual với only city
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_1_4_TC_2_UpdateAddressManual_OnlyCity_Returns200()
        {
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");
            var request = new { City = "Đà Nẵng" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PatchAsync("/Address/1/manual", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-1.4-TC-5: Update manual với invalid addressId
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_1_4_TC_5_UpdateAddressManual_NotFound_Returns404()
        {
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { City = "Hà Nội" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PatchAsync("/Address/99999/manual", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy địa chỉ", responseContent);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UpdateAddressManual_NoAuthToken_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { City = "Hà Nội" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PatchAsync("/Address/1/manual", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
