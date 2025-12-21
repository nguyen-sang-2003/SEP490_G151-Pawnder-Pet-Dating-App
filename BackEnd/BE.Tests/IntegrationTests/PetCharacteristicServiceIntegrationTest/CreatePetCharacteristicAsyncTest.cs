using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PetCharacteristicServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho CreatePetCharacteristic API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class CreatePetCharacteristicAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public CreatePetCharacteristicAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-PC-2.1 Integration Test Cases - CreatePetCharacteristic

        /// <summary>
        /// UC-PC-2.1-TC-1: Create characteristic with valid option type (string)
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PC_2_1_TC_1_CreatePetCharacteristic_ValidOptionType_Returns200()
        {
            // Arrange - petId=4 chưa có characteristic
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 5, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act - POST /api/PetCharacteristic/pet-characteristic/{petId}/{attributeId}
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/4/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PC-2.1-TC-2: Create characteristic with valid value type (number)
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PC_2_1_TC_2_CreatePetCharacteristic_ValidValueType_Returns200()
        {
            // Arrange - petId=2 chưa có characteristic với attributeId=2
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = (int?)null, Value = 15.5 };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/2/2", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PC-2.1-TC-3: Create characteristic with non-existent petId
        /// Expected: HTTP 404 Not Found với message "Pet không tồn tại."
        /// </summary>
        [Fact]
        public async Task UC_PC_2_1_TC_3_CreatePetCharacteristic_NonExistentPetId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 5, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/99999/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Pet không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-PC-2.1-TC-4: Create characteristic with non-existent attributeId
        /// Expected: HTTP 404 Not Found với message "Attribute không tồn tại."
        /// </summary>
        [Fact]
        public async Task UC_PC_2_1_TC_4_CreatePetCharacteristic_NonExistentAttributeId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 5, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/1/99999", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Attribute không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-PC-2.1-TC-8: Create duplicate characteristic
        /// Expected: HTTP 400 Bad Request với message "Đặc điểm này đã tồn tại cho pet."
        /// </summary>
        [Fact]
        public async Task UC_PC_2_1_TC_8_CreatePetCharacteristic_DuplicateCharacteristic_Returns400()
        {
            // Arrange - petId=1, attributeId=1 đã có characteristic trong seed data
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 5, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đặc điểm này đã tồn tại cho pet", responseContent);
        }

        /// <summary>
        /// UC-PC-2.1-TC-9: Create characteristic with invalid petId (negative)
        /// Expected: HTTP 404 Not Found với message "Pet không tồn tại."
        /// </summary>
        [Fact]
        public async Task UC_PC_2_1_TC_9_CreatePetCharacteristic_NegativePetId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 5, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/-1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Pet không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-PC-2.1-TC-10: Create characteristic with invalid attributeId (negative)
        /// Expected: HTTP 404 Not Found với message "Attribute không tồn tại."
        /// </summary>
        [Fact]
        public async Task UC_PC_2_1_TC_10_CreatePetCharacteristic_NegativeAttributeId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = 5, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/1/-1", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Attribute không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-PC-2.1-TC-12: Create characteristic with zero value
        /// Expected: HTTP 200 OK (value = 0 được chấp nhận, sẽ được set null trong service)
        /// </summary>
        [Fact]
        public async Task UC_PC_2_1_TC_12_CreatePetCharacteristic_ZeroValue_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new { OptionId = (int?)null, Value = 0.0 };
            var content = CreateJsonContent(request);

            // Act  
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/2/3", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task CreatePetCharacteristic_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();
            var request = new { OptionId = 5, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với role Admin (không được phép create)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task CreatePetCharacteristic_AdminRole_Returns403()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { OptionId = 5, Value = (double?)null };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PostAsync("/api/PetCharacteristic/pet-characteristic/1/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion
    }
}
