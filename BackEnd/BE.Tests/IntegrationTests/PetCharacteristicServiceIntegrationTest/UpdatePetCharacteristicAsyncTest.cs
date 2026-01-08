using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PetCharacteristicServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho UpdatePetCharacteristic API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class UpdatePetCharacteristicAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UpdatePetCharacteristicAsyncTest(CustomWebApplicationFactory factory)
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

        private StringContent CreateJsonContent(object obj)
        {
            return new StringContent(JsonSerializer.Serialize(obj), Encoding.UTF8, "application/json");
        }

        #region UC-PC-3.1 Integration Test Cases - UpdatePetCharacteristic

        /// <summary>
        /// UC-PC-3.1-TC-1: Update characteristic with valid optionId
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PC_3_1_TC_1_UpdatePetCharacteristic_ValidOptionId_Returns200()
        {
            // Arrange - Pet 1 có characteristic với AttributeId=1
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 6, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PC-3.1-TC-2: Update characteristic with valid value
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PC_3_1_TC_2_UpdatePetCharacteristic_ValidValue_Returns200()
        {
            // Arrange - Pet 3 có characteristic với AttributeId=2 (float type)
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = (int?)null, Value = 20.5 };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/3/2", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PC-3.1-TC-5: Update non-existent characteristic
        /// Expected: HTTP 404 Not Found với message "Đặc điểm này chưa tồn tại cho pet."
        /// </summary>
        [Fact]
        public async Task UC_PC_3_1_TC_5_UpdatePetCharacteristic_NonExistentCharacteristic_Returns404()
        {
            // Arrange - Pet 1 không có characteristic với AttributeId=5
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 6, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/2/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đặc điểm này chưa tồn tại cho pet", responseContent);
        }

        /// <summary>
        /// UC-PC-3.1-TC-6: Update characteristic with invalid optionId
        /// Expected: HTTP 404 Not Found với message "Option không tồn tại hoặc đã bị xóa."
        /// </summary>
        [Fact]
        public async Task UC_PC_3_1_TC_6_UpdatePetCharacteristic_InvalidOptionId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 99999, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Option không tồn tại hoặc đã bị xóa", responseContent);
        }

        /// <summary>
        /// UC-PC-3.1-TC-12: Update characteristic with zero value
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PC_3_1_TC_12_UpdatePetCharacteristic_ZeroValue_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = (int?)null, Value = 0.0 };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/3/2", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PC-3.1-TC-13: Update characteristic from optionId to different optionId
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PC_3_1_TC_13_UpdatePetCharacteristic_DifferentOptionId_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 7, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PC-3.1-TC-14: Update characteristic from value to different value
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PC_3_1_TC_14_UpdatePetCharacteristic_DifferentValue_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = (int?)null, Value = 25.0 };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/3/2", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UpdatePetCharacteristic_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();
            var request = new { OptionId = 6, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với role Admin (không được phép update)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task UpdatePetCharacteristic_AdminRole_Returns403()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { OptionId = 6, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/PetCharacteristic/pet-characteristic/1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion
    }
}
