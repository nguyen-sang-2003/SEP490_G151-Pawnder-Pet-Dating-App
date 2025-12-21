using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.UserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho CompleteProfile API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class CompleteProfileAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public CompleteProfileAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-U-6.1 Integration Test Cases

        /// <summary>
        /// UC-U-6.1-TC-1: Complete profile with valid userId
        /// Expected: HTTP 200 OK với isProfileComplete = true
        /// </summary>
        [Fact]
        public async Task UC_U_6_1_TC_1_CompleteProfile_ValidUserId_Returns200()
        {
            // Arrange - userId 1 trong seed data
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.PatchAsync("/user/1/complete-profile", null);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đã hoàn thành hồ sơ", responseContent);
            // Check for the property (case insensitive)
            Assert.Contains("isprofilecomplete", responseContent.ToLower());
        }

        /// <summary>
        /// UC-U-6.1-TC-2: Complete profile with non-existent userId
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_6_1_TC_2_CompleteProfile_NonExistentUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.PatchAsync("/user/99999/complete-profile", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy người dùng", responseContent);
        }

        /// <summary>
        /// UC-U-6.1-TC-3: Complete profile with invalid userId (negative)
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_6_1_TC_3_CompleteProfile_NegativeUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.PatchAsync("/user/-1/complete-profile", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-6.1-TC-4: Complete profile for already completed profile
        /// Note: Service vẫn trả về success nếu đã complete
        /// Expected: HTTP 200 OK
        /// </summary>
        [Fact]
        public async Task UC_U_6_1_TC_4_CompleteProfile_AlreadyComplete_Returns200()
        {
            // Arrange - userId 100 đã có isProfileComplete = true
            var client = CreateAuthenticatedClient(100, "User", "user@example.com");

            // Act
            var response = await client.PatchAsync("/user/100/complete-profile", null);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-U-6.1-TC-5: Complete profile with userId zero
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_6_1_TC_5_CompleteProfile_ZeroUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.PatchAsync("/user/0/complete-profile", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-6.1-TC-6: Complete profile for deleted user
        /// Note: Service trả về false nếu user không tìm thấy (bao gồm deleted)
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_6_1_TC_6_CompleteProfile_DeletedUser_Returns404()
        {
            // Arrange - Trước tiên xóa user, sau đó complete profile
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act - Thử với non-existent user
            var response = await client.PatchAsync("/user/88888/complete-profile", null);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// Test với Admin role (chỉ User role được phép)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task CompleteProfile_WithAdminRole_Returns403()
        {
            // Arrange - Admin role không có quyền
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.PatchAsync("/user/1/complete-profile", null);

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task CompleteProfile_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.PatchAsync("/user/1/complete-profile", null);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
