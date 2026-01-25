using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PetPhotoServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho ReorderPhotos API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class ReorderPhotosAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public ReorderPhotosAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-PP-3.1 Integration Test Cases - ReorderPhotos

        /// <summary>
        /// UC-PP-3.1-TC-1: Reorder photos with valid data
        /// Expected: HTTP 200 OK với message "Cập nhật thứ tự ảnh thành công."
        /// </summary>
        [Fact]
        public async Task UC_PP_3_1_TC_1_ReorderPhotos_ValidData_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new[]
            {
                new { PhotoId = 1, SortOrder = 2 },
                new { PhotoId = 2, SortOrder = 1 }
            };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/petphoto/reorder", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật thứ tự ảnh thành công", responseContent);
        }

        /// <summary>
        /// UC-PP-3.1-TC-2: Reorder photos with empty list
        /// Expected: HTTP 400 Bad Request với message "Danh sách trống."
        /// </summary>
        [Fact]
        public async Task UC_PP_3_1_TC_2_ReorderPhotos_EmptyList_Returns400()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new object[] { };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/petphoto/reorder", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Danh sách trống", responseContent);
        }

        /// <summary>
        /// UC-PP-3.1-TC-4: Reorder photos with non-existent photoId
        /// Expected: HTTP 404 Not Found với message "Có ảnh không tồn tại."
        /// </summary>
        [Fact]
        public async Task UC_PP_3_1_TC_4_ReorderPhotos_NonExistentPhotoId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new[]
            {
                new { PhotoId = 99999, SortOrder = 1 }
            };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/petphoto/reorder", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Có ảnh không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-PP-3.1-TC-5: Reorder photos with invalid photoId (negative)
        /// Expected: HTTP 404 Not Found với message "Có ảnh không tồn tại."
        /// </summary>
        [Fact]
        public async Task UC_PP_3_1_TC_5_ReorderPhotos_NegativePhotoId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new[]
            {
                new { PhotoId = -1, SortOrder = 1 }
            };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/petphoto/reorder", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Có ảnh không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-PP-3.1-TC-9: Reorder single photo
        /// Expected: HTTP 200 OK với message "Cập nhật thứ tự ảnh thành công."
        /// </summary>
        [Fact]
        public async Task UC_PP_3_1_TC_9_ReorderPhotos_SinglePhoto_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new[]
            {
                new { PhotoId = 1, SortOrder = 1 }
            };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/petphoto/reorder", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật thứ tự ảnh thành công", responseContent);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task ReorderPhotos_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();
            var request = new[] { new { PhotoId = 1, SortOrder = 1 } };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/petphoto/reorder", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với role Admin (không được phép reorder)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task ReorderPhotos_AdminRole_Returns403()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new[] { new { PhotoId = 1, SortOrder = 1 } };
            var content = CreateJsonContent(request);

            // Act
            var response = await client.PutAsync("/api/petphoto/reorder", content);

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion
    }
}
