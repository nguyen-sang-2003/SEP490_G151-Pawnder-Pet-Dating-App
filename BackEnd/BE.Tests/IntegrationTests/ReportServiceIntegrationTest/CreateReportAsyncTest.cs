using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ReportServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho CreateReport API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class CreateReportAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public CreateReportAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-R-4.1 Integration Test Cases

        /// <summary>
        /// UC-R-4.1-TC-2: Create report with missing reason (null)
        /// Expected: HTTP 400 Bad Request với message "Reason is required."
        /// Note: API message là tiếng Anh theo ReportService
        /// </summary>
        [Fact]
        public async Task UC_R_4_1_TC_2_CreateReport_MissingReason_Returns400()
        {
            // Arrange
            var client = CreateAuthenticatedClient(10, "User", "reporter@example.com");
            var request = new { Reason = (string?)null };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act - userReportId = 10, contentId = 11 (chưa có report)
            var response = await client.PostAsync("/api/report/10/11", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Reason", responseContent);
        }

        /// <summary>
        /// UC-R-4.1-TC-3: Create report with empty reason
        /// Expected: HTTP 400 Bad Request với message "Reason is required."
        /// </summary>
        [Fact]
        public async Task UC_R_4_1_TC_3_CreateReport_EmptyReason_Returns400()
        {
            // Arrange
            var client = CreateAuthenticatedClient(10, "User", "reporter@example.com");
            var request = new { Reason = "" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/report/10/11", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Reason", responseContent);
        }

        /// <summary>
        /// UC-R-4.1-TC-4: Create report with non-existent userReportId
        /// Expected: HTTP 404 Not Found với message "User with ID 99999 not found."
        /// </summary>
        [Fact]
        public async Task UC_R_4_1_TC_4_CreateReport_NonExistentUserReportId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(99999, "User", "notexist@example.com");
            var request = new { Reason = "Nội dung không phù hợp" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/report/99999/10", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("not found", responseContent.ToLower());
        }

        /// <summary>
        /// UC-R-4.1-TC-5: Create report with non-existent contentId
        /// Expected: HTTP 404 Not Found với message "Content with ID 99999 not found."
        /// </summary>
        [Fact]
        public async Task UC_R_4_1_TC_5_CreateReport_NonExistentContentId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(10, "User", "reporter@example.com");
            var request = new { Reason = "Nội dung không phù hợp" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/report/10/99999", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("not found", responseContent.ToLower());
        }

        /// <summary>
        /// UC-R-4.1-TC-6: Create report with invalid userReportId (negative)
        /// Expected: HTTP 404 Not Found với message về user không tìm thấy
        /// </summary>
        [Fact]
        public async Task UC_R_4_1_TC_6_CreateReport_NegativeUserReportId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(-1, "User", "test@example.com");
            var request = new { Reason = "Nội dung không phù hợp" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/report/-1/10", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("not found", responseContent.ToLower());
        }

        /// <summary>
        /// UC-R-4.1-TC-7: Create report with invalid contentId (negative)
        /// Expected: HTTP 404 Not Found với message về content không tìm thấy
        /// </summary>
        [Fact]
        public async Task UC_R_4_1_TC_7_CreateReport_NegativeContentId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(10, "User", "reporter@example.com");
            var request = new { Reason = "Nội dung không phù hợp" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/report/10/-1", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("not found", responseContent.ToLower());
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task CreateReport_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();
            var request = new { Reason = "Test reason" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/report/1/10", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với Admin role (chỉ User role được phép)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task CreateReport_WithAdminRole_Returns403()
        {
            // Arrange - Admin role không có quyền tạo report
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { Reason = "Test reason" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/report/101/10", content);

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion
    }
}
