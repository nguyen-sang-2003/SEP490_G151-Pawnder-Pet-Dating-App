using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.ReportServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetReportById API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class GetReportByIdAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetReportByIdAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-R-2.1 Integration Test Cases

        /// <summary>
        /// UC-R-2.1-TC-1: Get report by valid reportId
        /// Expected: HTTP 200 OK với message "Lấy thông tin báo cáo thành công."
        /// </summary>
        [Fact]
        public async Task UC_R_2_1_TC_1_GetReportById_ValidReportId_Returns200()
        {
            // Arrange - Cần role Admin hoặc User để access, reportId = 1 đã được seed
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/api/report/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Lấy thông tin báo cáo thành công", responseContent);
        }

        /// <summary>
        /// UC-R-2.1-TC-2: Get report by non-existent reportId
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy báo cáo với ID = 99999."
        /// </summary>
        [Fact]
        public async Task UC_R_2_1_TC_2_GetReportById_NonExistentReportId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/api/report/99999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy báo cáo với ID = 99999", responseContent);
        }

        /// <summary>
        /// UC-R-2.1-TC-3: Get report by invalid reportId (negative)
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy báo cáo với ID = -1."
        /// </summary>
        [Fact]
        public async Task UC_R_2_1_TC_3_GetReportById_NegativeReportId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/api/report/-1");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy báo cáo với ID = -1", responseContent);
        }

        /// <summary>
        /// UC-R-2.1-TC-4: Get report by reportId zero
        /// Expected: HTTP 404 Not Found với message "Không tìm thấy báo cáo với ID = 0."
        /// </summary>
        [Fact]
        public async Task UC_R_2_1_TC_4_GetReportById_ZeroReportId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/api/report/0");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy báo cáo với ID = 0", responseContent);
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetReportById_NoAuthToken_Returns401()
        {
            // Arrange - Client không có auth header
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/report/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
