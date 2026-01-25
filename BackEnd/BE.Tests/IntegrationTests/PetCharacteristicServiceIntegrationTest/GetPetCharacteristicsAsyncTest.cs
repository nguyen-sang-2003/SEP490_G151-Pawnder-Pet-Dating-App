using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PetCharacteristicServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho GetPetCharacteristics API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class GetPetCharacteristicsAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetPetCharacteristicsAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-PC-1.1 Integration Test Cases - GetPetCharacteristics

        /// <summary>
        /// UC-PC-1.1-TC-1: Get pet characteristics with valid petId
        /// Expected: HTTP 200 OK với message "Lấy đặc điểm thú cưng thành công."
        /// </summary>
        [Fact]
        public async Task UC_PC_1_1_TC_1_GetPetCharacteristics_ValidPetId_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetCharacteristic/pet-characteristic/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PC-1.1-TC-2: Get pet characteristics with no characteristics
        /// Expected: HTTP 200 OK với data: []
        /// </summary>
        [Fact]
        public async Task UC_PC_1_1_TC_2_GetPetCharacteristics_NoCharacteristics_Returns200WithEmptyArray()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 2 không có characteristics
            var response = await client.GetAsync("/api/PetCharacteristic/pet-characteristic/2");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("[]", responseContent);
        }

        /// <summary>
        /// UC-PC-1.1-TC-3: Get pet characteristics with non-existent petId
        /// Expected: HTTP 200 OK với data: []
        /// </summary>
        [Fact]
        public async Task UC_PC_1_1_TC_3_GetPetCharacteristics_NonExistentPetId_Returns200WithEmptyArray()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetCharacteristic/pet-characteristic/99999");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("[]", responseContent);
        }

        /// <summary>
        /// UC-PC-1.1-TC-4: Get pet characteristics with invalid petId (negative)
        /// Expected: HTTP 200 OK với data: []
        /// </summary>
        [Fact]
        public async Task UC_PC_1_1_TC_4_GetPetCharacteristics_InvalidPetIdNegative_Returns200WithEmptyArray()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetCharacteristic/pet-characteristic/-1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("[]", responseContent);
        }

        /// <summary>
        /// UC-PC-1.1-TC-5: Get pet characteristics with petId zero
        /// Expected: HTTP 200 OK với data: []
        /// </summary>
        [Fact]
        public async Task UC_PC_1_1_TC_5_GetPetCharacteristics_PetIdZero_Returns200WithEmptyArray()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/PetCharacteristic/pet-characteristic/0");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("[]", responseContent);
        }

        /// <summary>
        /// UC-PC-1.1-TC-6: Get pet characteristics with multiple characteristics
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PC_1_1_TC_6_GetPetCharacteristics_MultipleCharacteristics_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 3 có multiple characteristics  
            var response = await client.GetAsync("/api/PetCharacteristic/pet-characteristic/3");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetPetCharacteristics_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/PetCharacteristic/pet-characteristic/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
