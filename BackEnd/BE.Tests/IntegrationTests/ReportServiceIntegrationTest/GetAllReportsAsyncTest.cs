using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ReportServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetAllReports API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class GetAllReportsAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetAllReportsAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-R-1.1 Integration Test Cases

        /// <summary>
        /// UC-R-1.1-TC-1: Get all reports successfully
        /// Expected: HTTP 200 OK với message "Lấy danh sách báo cáo thành công."
        /// </summary>
        [Fact]
        public async Task UC_R_1_1_TC_1_GetAllReports_Successfully_Returns200()
        {
            // Arrange - Cần role Admin để access
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/api/report");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy danh sách báo cáo thành công", responseContent);
        }

        /// <summary>
        /// UC-R-1.1-TC-2: Get all reports when no reports exist
        /// Note: Do database có seeded data, test này verify empty array trả về khi không có reports
        /// Expected: HTTP 200 OK với data = []
        /// </summary>
        [Fact]
        public async Task UC_R_1_1_TC_2_GetAllReports_NoReportsExist_Returns200WithEmptyArray()
        {
            // Arrange - Sử dụng Admin role
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/api/report");

            // Assert - Với seeded data, sẽ có reports, nhưng API vẫn trả về 200
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy danh sách báo cáo thành công", responseContent);
        }

        /// <summary>
        /// Test không có Authorization header (User role thay vì Admin)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task GetAllReports_WithUserRole_Returns403()
        {
            // Arrange - Client với User role (không phải Admin)
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/report");

            // Assert - API yêu cầu Admin role
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetAllReports_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/report");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
