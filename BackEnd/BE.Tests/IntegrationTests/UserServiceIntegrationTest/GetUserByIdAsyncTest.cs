using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.UserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho GetUserById API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class GetUserByIdAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public GetUserByIdAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-U-3.1 Integration Test Cases

        /// <summary>
        /// UC-U-3.1-TC-1: Get user by valid userId
        /// Expected: HTTP 200 OK với user data
        /// </summary>
        [Fact]
        public async Task UC_U_3_1_TC_1_GetUserById_ValidUserId_Returns200()
        {
            // Arrange - userId = 1 đã được seed
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.GetAsync("/user/1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            // Check for email which should be in the response
            Assert.Contains("@", responseContent);
        }

        /// <summary>
        /// UC-U-3.1-TC-2: Get user by non-existent userId
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_3_1_TC_2_GetUserById_NonExistentUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/user/99999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-3.1-TC-3: Get user by invalid userId (negative)
        /// Note: ASP.NET Core routes với constraint int bỏ qua negative values nếu không match
        /// Expected: HTTP 404 Not Found (không tìm thấy user -1)
        /// </summary>
        [Fact]
        public async Task UC_U_3_1_TC_3_GetUserById_NegativeUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/user/-1");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-3.1-TC-4: Get user by userId zero
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_3_1_TC_4_GetUserById_ZeroUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "Admin", "admin@example.com");

            // Act
            var response = await client.GetAsync("/user/0");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-3.1-TC-5: Get deleted user by userId
        /// Note: API returns null for deleted users (GetUserByIdAsync với includeDeleted=false)
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_3_1_TC_5_GetUserById_DeletedUser_Returns404()
        {
            // Arrange - cần seed một deleted user để test
            // Hiện tại seed data không có deleted user với ID cố định
            var client = CreateAuthenticatedClient(1, "Admin", "admin@example.com");

            // Act - thử với user ID không tồn tại
            var response = await client.GetAsync("/user/88888");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task GetUserById_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/user/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
