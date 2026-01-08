using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Xunit;

namespace BE.Tests.IntegrationTests.PetPhotoServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho UploadPhotos API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class UploadPhotosAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UploadPhotosAsyncTest(CustomWebApplicationFactory factory)
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

        private MultipartFormDataContent CreateMultipartContent(int petId, params (string fileName, string contentType, byte[] content)[] files)
        {
            var content = new MultipartFormDataContent();
            content.Add(new StringContent(petId.ToString()), "petId");

            foreach (var (fileName, contentType, fileContent) in files)
            {
                var fileStreamContent = new ByteArrayContent(fileContent);
                fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
                content.Add(fileStreamContent, "files", fileName);
            }

            return content;
        }

        #region UC-PP-2.1 Integration Test Cases - UploadPhotos

        /// <summary>
        /// UC-PP-2.1-TC-1: Upload single valid photo
        /// Expected: HTTP 200 OK với message "Tải ảnh thành công."
        /// Note: Test này bị skip vì cần IPhotoStorage mock/real cloud storage
        /// </summary>
        [Fact(Skip = "Requires IPhotoStorage mock or real cloud storage configuration")]
        public async Task UC_PP_2_1_TC_1_UploadPhotos_SingleValidPhoto_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var fakeImageBytes = Encoding.UTF8.GetBytes("fake image content");
            var content = CreateMultipartContent(4, ("pet1.jpg", "image/jpeg", fakeImageBytes)); // petId=4 không có photos

            // Act
            var response = await client.PostAsync("/api/petphoto", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Tải ảnh thành công", responseContent);
        }

        /// <summary>
        /// UC-PP-2.1-TC-3: Upload photos with non-existent petId
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy pet."
        /// </summary>
        [Fact]
        public async Task UC_PP_2_1_TC_3_UploadPhotos_NonExistentPetId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var fakeImageBytes = Encoding.UTF8.GetBytes("fake image content");
            var content = CreateMultipartContent(99999, ("pet1.jpg", "image/jpeg", fakeImageBytes));

            // Act
            var response = await client.PostAsync("/api/petphoto", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy pet", responseContent);
        }

        /// <summary>
        /// UC-PP-2.1-TC-4: Upload photos with invalid petId (negative)
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy pet."
        /// </summary>
        [Fact]
        public async Task UC_PP_2_1_TC_4_UploadPhotos_NegativePetId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var fakeImageBytes = Encoding.UTF8.GetBytes("fake image content");
            var content = CreateMultipartContent(-1, ("pet1.jpg", "image/jpeg", fakeImageBytes));

            // Act
            var response = await client.PostAsync("/api/petphoto", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy pet", responseContent);
        }

        /// <summary>
        /// UC-PP-2.1-TC-5: Upload photos with no files
        /// Expected: HTTP 400 Bad Request với message "Chưa chọn ảnh."
        /// </summary>
        [Fact]
        public async Task UC_PP_2_1_TC_5_UploadPhotos_NoFiles_Returns400()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var content = new MultipartFormDataContent();
            content.Add(new StringContent("1"), "petId");
            // Không thêm files

            // Act
            var response = await client.PostAsync("/api/petphoto", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Chưa chọn ảnh", responseContent);
        }

        /// <summary>
        /// Test không có Authorization header
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UploadPhotos_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();
            var fakeImageBytes = Encoding.UTF8.GetBytes("fake image content");
            var content = CreateMultipartContent(1, ("pet1.jpg", "image/jpeg", fakeImageBytes));

            // Act
            var response = await client.PostAsync("/api/petphoto", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với role Admin (không được phép upload)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task UploadPhotos_AdminRole_Returns403()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var fakeImageBytes = Encoding.UTF8.GetBytes("fake image content");
            var content = CreateMultipartContent(1, ("pet1.jpg", "image/jpeg", fakeImageBytes));

            // Act
            var response = await client.PostAsync("/api/petphoto", content);

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion
    }
}
