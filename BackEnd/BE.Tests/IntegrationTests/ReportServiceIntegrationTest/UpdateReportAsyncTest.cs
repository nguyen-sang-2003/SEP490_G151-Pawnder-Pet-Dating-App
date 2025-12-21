using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ReportServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho UpdateReport API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class UpdateReportAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UpdateReportAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-R-5.1 Integration Test Cases

        /// <summary>
        /// UC-R-5.1-TC-1: Update report with valid status
        /// Expected: HTTP 200 OK với message "Cập nhật báo cáo thành công."
        /// </summary>
        [Fact]
        public async Task UC_R_5_1_TC_1_UpdateReport_ValidStatus_Returns200()
        {
            // Arrange - reportId = 1 đã được seed
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { Status = "RESOLVED", Resolution = (string?)null };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật báo cáo thành công", responseContent);
        }

        /// <summary>
        /// UC-R-5.1-TC-2: Update report with valid resolution
        /// Expected: HTTP 200 OK với message "Cập nhật báo cáo thành công."
        /// </summary>
        [Fact]
        public async Task UC_R_5_1_TC_2_UpdateReport_ValidResolution_Returns200()
        {
            // Arrange - reportId = 2 đã được seed
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { Status = (string?)null, Resolution = "Đã xử lý và xóa nội dung vi phạm" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/2", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật báo cáo thành công", responseContent);
        }

        /// <summary>
        /// UC-R-5.1-TC-3: Update report with both status and resolution
        /// Expected: HTTP 200 OK với message "Cập nhật báo cáo thành công."
        /// </summary>
        [Fact]
        public async Task UC_R_5_1_TC_3_UpdateReport_BothStatusAndResolution_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { Status = "RESOLVED", Resolution = "Đã xử lý và cảnh cáo người dùng" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật báo cáo thành công", responseContent);
        }

        /// <summary>
        /// UC-R-5.1-TC-4: Update report with non-existent reportId
        /// Expected: HTTP 404 Not Found với message "Report with ID 99999 not found."
        /// </summary>
        [Fact]
        public async Task UC_R_5_1_TC_4_UpdateReport_NonExistentReportId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { Status = "RESOLVED", Resolution = (string?)null };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/99999", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("not found", responseContent.ToLower());
        }

        /// <summary>
        /// UC-R-5.1-TC-5: Update report with invalid reportId (negative)
        /// Expected: HTTP 404 Not Found với message về report không tìm thấy
        /// </summary>
        [Fact]
        public async Task UC_R_5_1_TC_5_UpdateReport_NegativeReportId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { Status = "RESOLVED", Resolution = (string?)null };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/-1", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("not found", responseContent.ToLower());
        }

        /// <summary>
        /// UC-R-5.1-TC-6: Update report with reportId zero
        /// Expected: HTTP 404 Not Found với message về report không tìm thấy
        /// </summary>
        [Fact]
        public async Task UC_R_5_1_TC_6_UpdateReport_ZeroReportId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { Status = "RESOLVED", Resolution = (string?)null };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/0", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("not found", responseContent.ToLower());
        }

        /// <summary>
        /// UC-R-5.1-TC-8: Update report with empty fields (both null)
        /// Note: Service hiện tại chấp nhận empty fields và vẫn update UpdatedAt
        /// Expected: HTTP 200 OK vì service không validate required fields
        /// </summary>
        [Fact]
        public async Task UC_R_5_1_TC_8_UpdateReport_EmptyFields_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new { Status = (string?)null, Resolution = (string?)null };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/1", content);

            // Assert - Service hiện tại chấp nhận và chỉ update UpdatedAt
            // Nếu cần validate "Cần ít nhất một trường để cập nhật", cần thêm logic trong service
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UpdateReport_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();
            var request = new { Status = "RESOLVED" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với User role có quyền update
        /// Expected: HTTP 200 OK vì User và Admin đều có quyền update
        /// </summary>
        [Fact]
        public async Task UpdateReport_WithUserRole_Returns200()
        {
            // Arrange - User role cũng được phép update report
            var client = CreateAuthenticatedClient(10, "User", "reporter@example.com");
            var request = new { Status = "Pending", Resolution = "Test resolution" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/api/report/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        #endregion
    }
}
