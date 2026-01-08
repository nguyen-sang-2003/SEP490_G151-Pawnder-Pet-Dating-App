using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AddressServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho CreateAddressForUser API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class CreateAddressForUserIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public CreateAddressForUserIntegrationTest(CustomWebApplicationFactory factory)
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

        #region UC-1.1 Integration Test Cases

        /// <summary>
        /// UC-1.1-TC-2: Create address với userId không tồn tại
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy người dùng"
        /// </summary>
        [Fact]
        public async Task UC_1_1_TC_2_CreateAddressForUser_UserNotFound_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(99999, "User", "notexist@test.com");
            var request = new { Latitude = 10.762622m, Longitude = 106.660172m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/Address/99999", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy người dùng", responseContent);
        }

        /// <summary>
        /// UC-1.1-TC-3: Create address khi user đã có address
        /// Expected: HTTP 400 Bad Request với message "User đã có địa chỉ..."
        /// </summary>
        [Fact]
        public async Task UC_1_1_TC_3_CreateAddressForUser_UserAlreadyHasAddress_Returns400()
        {
            // Arrange
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");
            var request = new { Latitude = 10.762622m, Longitude = 106.660172m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/Address/2", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("User đã có địa chỉ", responseContent);
        }

        /// <summary>
        /// UC-1.1-TC-4: Create address với invalid latitude (> 90)
        /// Expected: HTTP 500 (ArgumentException is not caught in controller)
        /// </summary>
        [Fact]
        public async Task UC_1_1_TC_4_CreateAddressForUser_InvalidLatitude_ReturnsError()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { Latitude = 91m, Longitude = 106.660172m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/Address/1", content);

            // Assert - Should return 500 because ArgumentException is not caught
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }

        /// <summary>
        /// UC-1.1-TC-5: Create address với invalid latitude (< -90)
        /// Expected: HTTP 500 (ArgumentException is not caught in controller)
        /// </summary>
        [Fact]
        public async Task UC_1_1_TC_5_CreateAddressForUser_InvalidLatitudeNegative_ReturnsError()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { Latitude = -91m, Longitude = 106.660172m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/Address/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }

        /// <summary>
        /// UC-1.1-TC-6: Create address với invalid longitude (> 180)
        /// Expected: HTTP 500 (ArgumentException is not caught in controller)
        /// </summary>
        [Fact]
        public async Task UC_1_1_TC_6_CreateAddressForUser_InvalidLongitude_ReturnsError()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { Latitude = 10.762622m, Longitude = 181m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/Address/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }

        /// <summary>
        /// UC-1.1-TC-7: Create address với invalid longitude (< -180)
        /// Expected: HTTP 500 (ArgumentException is not caught in controller)
        /// </summary>
        [Fact]
        public async Task UC_1_1_TC_7_CreateAddressForUser_InvalidLongitudeNegative_ReturnsError()
        {
            // Arrange  
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { Latitude = 10.762622m, Longitude = -181m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/Address/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task CreateAddressForUser_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();
            var request = new { Latitude = 10.762622m, Longitude = 106.660172m };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/Address/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
