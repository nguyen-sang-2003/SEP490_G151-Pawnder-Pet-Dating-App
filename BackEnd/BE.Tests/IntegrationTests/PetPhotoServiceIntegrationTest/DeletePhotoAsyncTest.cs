using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PetPhotoServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho DeletePhoto API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class DeletePhotoAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public DeletePhotoAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-PP-4.1 Integration Test Cases - DeletePhoto

        /// <summary>
        /// UC-PP-4.1-TC-1: Soft delete photo with valid photoId
        /// Expected: HTTP 200 OK với message "Xóa ảnh thành công."
        /// </summary>
        [Fact]
        public async Task UC_PP_4_1_TC_1_DeletePhoto_SoftDelete_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - soft delete (hard=false)
            var response = await client.DeleteAsync("/api/petphoto/1?hard=false");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Xóa ảnh thành công", responseContent);
        }

        /// <summary>
        /// UC-PP-4.1-TC-2: Hard delete photo with valid photoId
        /// Expected: HTTP 200 OK với message "Xóa ảnh thành công."
        /// </summary>
        [Fact]
        public async Task UC_PP_4_1_TC_2_DeletePhoto_HardDelete_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - hard delete (hard=true)
            var response = await client.DeleteAsync("/api/petphoto/2?hard=true");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Xóa ảnh thành công", responseContent);
        }

        /// <summary>
        /// UC-PP-4.1-TC-3: Delete photo with non-existent photoId
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy ảnh."
        /// </summary>
        [Fact]
        public async Task UC_PP_4_1_TC_3_DeletePhoto_NonExistentPhotoId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.DeleteAsync("/api/petphoto/99999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy ảnh", responseContent);
        }

        /// <summary>
        /// UC-PP-4.1-TC-4: Delete photo with invalid photoId (negative)
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy ảnh."
        /// </summary>
        [Fact]
        public async Task UC_PP_4_1_TC_4_DeletePhoto_NegativePhotoId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.DeleteAsync("/api/petphoto/-1");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy ảnh", responseContent);
        }

        /// <summary>
        /// UC-PP-4.1-TC-5: Delete photo with photoId zero
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy ảnh."
        /// </summary>
        [Fact]
        public async Task UC_PP_4_1_TC_5_DeletePhoto_ZeroPhotoId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.DeleteAsync("/api/petphoto/0");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy ảnh", responseContent);
        }

        /// <summary>
        /// UC-PP-4.1-TC-6: Delete primary photo
        /// Expected: HTTP 200 OK với message "Xóa ảnh thành công."
        /// </summary>
        [Fact]
        public async Task UC_PP_4_1_TC_6_DeletePhoto_PrimaryPhoto_Returns200()
        {
            // Arrange - photoId=3 là primary của pet 3
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.DeleteAsync("/api/petphoto/3");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Xóa ảnh thành công", responseContent);
        }

        /// <summary>
        /// UC-PP-4.1-TC-7: Delete already deleted photo (soft)
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy ảnh."
        /// </summary>
        [Fact]
        public async Task UC_PP_4_1_TC_7_DeletePhoto_AlreadyDeleted_Returns404()
        {
            // Arrange - photoId=5 đã bị xóa trước đó
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.DeleteAsync("/api/petphoto/5");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy ảnh", responseContent);
        }

        /// <summary>
        /// UC-PP-4.1-TC-9: Delete without hard parameter (defaults to soft)
        /// Expected: HTTP 200 OK với message "Xóa ảnh thành công."
        /// </summary>
        [Fact]
        public async Task UC_PP_4_1_TC_9_DeletePhoto_DefaultSoftDelete_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - không có query param hard, mặc định là soft delete
            var response = await client.DeleteAsync("/api/petphoto/4");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Xóa ảnh thành công", responseContent);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task DeletePhoto_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.DeleteAsync("/api/petphoto/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với role Admin (không được phép delete)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task DeletePhoto_AdminRole_Returns403()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.DeleteAsync("/api/petphoto/1");

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion
    }
}
