using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Xunit;

namespace BE.Tests.IntegrationTests.PetImageAnalysisServiceIntegrationTest
{
    /// <summary>
    /// REAL Integration Tests cho AnalyzeImage API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class AnalyzeImageAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public AnalyzeImageAsyncTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        private MultipartFormDataContent CreateImageContent(string fileName, string contentType, byte[] content)
        {
            var formContent = new MultipartFormDataContent();
            var fileStreamContent = new ByteArrayContent(content);
            fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            formContent.Add(fileStreamContent, "image", fileName);
            return formContent;
        }

        #region UC-PIA-1.1 Integration Test Cases - AnalyzeImage (Single)

        /// <summary>
        /// UC-PIA-1.1-TC-5: Analyze image with empty file
        /// Expected: HTTP 400 Bad Request với message "Vui lòng tải lên ảnh thú cưng"
        /// </summary>
        [Fact]
        public async Task UC_PIA_1_1_TC_5_AnalyzeImage_EmptyFile_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var content = CreateImageContent("empty.jpg", "image/jpeg", Array.Empty<byte>());

            // Act
            var response = await client.PostAsync("/api/PetImageAnalysis/analyze", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Vui lòng tải lên ảnh thú cưng", responseContent);
        }

        /// <summary>
        /// UC-PIA-1.1-TC-6: Analyze image with invalid file type (PDF)
        /// Expected: HTTP 400 Bad Request với message "Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP"
        /// </summary>
        [Fact]
        public async Task UC_PIA_1_1_TC_6_AnalyzeImage_InvalidTypePDF_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var fakeContent = Encoding.UTF8.GetBytes("fake pdf content");
            var content = CreateImageContent("document.pdf", "application/pdf", fakeContent);

            // Act
            var response = await client.PostAsync("/api/PetImageAnalysis/analyze", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP", responseContent);
        }

        /// <summary>
        /// UC-PIA-1.1-TC-7: Analyze image with invalid file type (GIF)
        /// Expected: HTTP 400 Bad Request với message "Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP"
        /// </summary>
        [Fact]
        public async Task UC_PIA_1_1_TC_7_AnalyzeImage_InvalidTypeGIF_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var fakeContent = Encoding.UTF8.GetBytes("fake gif content");
            var content = CreateImageContent("animated.gif", "image/gif", fakeContent);

            // Act
            var response = await client.PostAsync("/api/PetImageAnalysis/analyze", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP", responseContent);
        }

        #endregion
    }
}
