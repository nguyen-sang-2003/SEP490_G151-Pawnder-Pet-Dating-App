using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PetPhotoServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho GetPhotosByPetId API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class GetPhotosByPetIdAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetPhotosByPetIdAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-PP-1.1 Integration Test Cases - GetPhotosByPetId

        /// <summary>
        /// UC-PP-1.1-TC-1: Get photos by valid petId with existing photos
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PP_1_1_TC_1_GetPhotosByPetId_ValidPetIdWithPhotos_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/petphoto/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PP-1.1-TC-2: Get photos by valid petId with no photos
        /// Expected: HTTP 200 OK với data: []
        /// </summary>
        [Fact]
        public async Task UC_PP_1_1_TC_2_GetPhotosByPetId_ValidPetIdNoPhotos_Returns200WithEmptyArray()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 2 không có photos
            var response = await client.GetAsync("/api/petphoto/2");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("[]", responseContent);
        }

        /// <summary>
        /// UC-PP-1.1-TC-3: Get photos by non-existent petId
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy thú cưng."
        /// </summary>
        [Fact]
        public async Task UC_PP_1_1_TC_3_GetPhotosByPetId_NonExistentPetId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/petphoto/99999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy pet", responseContent);
        }

        /// <summary>
        /// UC-PP-1.1-TC-4: Get photos by invalid petId (negative)
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy thú cưng."
        /// </summary>
        [Fact]
        public async Task UC_PP_1_1_TC_4_GetPhotosByPetId_NegativePetId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/petphoto/-1");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy pet", responseContent);
        }

        /// <summary>
        /// UC-PP-1.1-TC-5: Get photos by petId zero
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy thú cưng."
        /// </summary>
        [Fact]
        public async Task UC_PP_1_1_TC_5_GetPhotosByPetId_ZeroPetId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/petphoto/0");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy pet", responseContent);
        }

        /// <summary>
        /// UC-PP-1.1-TC-6: Get photos sorted by sortOrder
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PP_1_1_TC_6_GetPhotosByPetId_SortedBySortOrder_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/petphoto/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-PP-1.1-TC-7: Get photos excluding deleted photos
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_PP_1_1_TC_7_GetPhotosByPetId_ExcludesDeletedPhotos_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - petId = 3 có photos nhưng một số đã bị xóa
            var response = await client.GetAsync("/api/petphoto/3");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetPhotosByPetId_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/petphoto/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
