using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.ReportServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetReportsByUserId API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class GetReportsByUserIdAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetReportsByUserIdAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-R-3.1 Integration Test Cases

        /// <summary>
        /// UC-R-3.1-TC-1: Get reports by valid userId with existing reports
        /// Expected: HTTP 200 OK với message "Lấy danh sách báo cáo thành công."
        /// Note: userId = 10 đã được seed với reports
        /// </summary>
        [Fact]
        public async Task UC_R_3_1_TC_1_GetReportsByUserId_ValidUserWithReports_Returns200()
        {
            // Arrange - User role, userId = 10 có reports trong seed data
            var client = CreateAuthenticatedClient(10, "User", "reporter@example.com");

            // Act
            var response = await client.GetAsync("/api/report/user/10");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy danh sách báo cáo thành công", responseContent);
        }

        /// <summary>
        /// UC-R-3.1-TC-2: Get reports by valid userId with no reports
        /// Expected: HTTP 200 OK với message "Bạn chưa gửi báo cáo nào." và data = []
        /// Note: userId = 12 được seed nhưng không có reports
        /// </summary>
        [Fact]
        public async Task UC_R_3_1_TC_2_GetReportsByUserId_ValidUserWithNoReports_Returns200WithEmptyArray()
        {
            // Arrange - userId = 12 không có reports
            var client = CreateAuthenticatedClient(12, "User", "noreports@example.com");

            // Act
            var response = await client.GetAsync("/api/report/user/12");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Bạn chưa gửi báo cáo nào", responseContent);
        }

        /// <summary>
        /// UC-R-3.1-TC-3: Get reports by non-existent userId
        /// Expected: HTTP 200 OK với message "Bạn chưa gửi báo cáo nào." và data = []
        /// </summary>
        [Fact]
        public async Task UC_R_3_1_TC_3_GetReportsByUserId_NonExistentUserId_Returns200WithEmptyArray()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/report/user/99999");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Bạn chưa gửi báo cáo nào", responseContent);
        }

        /// <summary>
        /// UC-R-3.1-TC-4: Get reports by invalid userId (negative)
        /// Expected: HTTP 200 OK với message "Bạn chưa gửi báo cáo nào." và data = []
        /// </summary>
        [Fact]
        public async Task UC_R_3_1_TC_4_GetReportsByUserId_NegativeUserId_Returns200WithEmptyArray()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/report/user/-1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Bạn chưa gửi báo cáo nào", responseContent);
        }

        /// <summary>
        /// UC-R-3.1-TC-5: Get reports by userId zero
        /// Expected: HTTP 200 OK với message "Bạn chưa gửi báo cáo nào." và data = []
        /// </summary>
        [Fact]
        public async Task UC_R_3_1_TC_5_GetReportsByUserId_ZeroUserId_Returns200WithEmptyArray()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/api/report/user/0");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Bạn chưa gửi báo cáo nào", responseContent);
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetReportsByUserId_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/report/user/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        /// <summary>
        /// Test với Admin role (chỉ User role được phép)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task GetReportsByUserId_WithAdminRole_Returns403()
        {
            // Arrange - Admin role không có quyền truy cập endpoint này
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/api/report/user/10");

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        #endregion
    }
}
