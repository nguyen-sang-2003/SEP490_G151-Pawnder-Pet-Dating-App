using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.UserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho SoftDeleteUser API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class SoftDeleteUserAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public SoftDeleteUserAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-U-5.1 Integration Test Cases

        /// <summary>
        /// UC-U-5.1-TC-1: Soft delete user with valid userId
        /// Expected: HTTP 204 No Content
        /// Note: userId 10 là reporter user trong seed data
        /// </summary>
        [Fact]
        public async Task UC_U_5_1_TC_1_SoftDeleteUser_ValidUserId_Returns204()
        {
            // Arrange - Cần Admin role để delete
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act - Delete user 10 (reporter user)
            var response = await client.DeleteAsync("/user/10");

            // Assert
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        /// <summary>
        /// UC-U-5.1-TC-2: Soft delete user with non-existent userId
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_5_1_TC_2_SoftDeleteUser_NonExistentUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.DeleteAsync("/user/99999");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-5.1-TC-3: Soft delete user with invalid userId (negative)
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_5_1_TC_3_SoftDeleteUser_NegativeUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.DeleteAsync("/user/-1");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-5.1-TC-4: Soft delete user with userId zero
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_5_1_TC_4_SoftDeleteUser_ZeroUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act
            var response = await client.DeleteAsync("/user/0");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-5.1-TC-5: Soft delete already deleted user
        /// Note: Service returns true for already deleted users (idempotent)
        /// Expected: HTTP 204 No Content
        /// </summary>
        [Fact]
        public async Task UC_U_5_1_TC_5_SoftDeleteUser_AlreadyDeleted_Returns204()
        {
            // Arrange - Delete user 11 first
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            await client.DeleteAsync("/user/11");

            // Act - Try to delete again
            var response = await client.DeleteAsync("/user/11");

            // Assert - Service trả về success cho user đã xóa
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        /// <summary>
        /// UC-U-5.1-TC-6: Soft delete admin user
        /// Note: Service hiện không block việc xóa admin
        /// Expected: HTTP 204 No Content hoặc 403 (tùy business logic)
        /// </summary>
        [Fact]
        public async Task UC_U_5_1_TC_6_SoftDeleteUser_AdminUser_Returns204Or403()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");

            // Act - Thử xóa admin user (userId 101)
            var response = await client.DeleteAsync("/user/101");

            // Assert - Service hiện không block xóa admin
            Assert.True(response.StatusCode == HttpStatusCode.NoContent ||
                       response.StatusCode == HttpStatusCode.Forbidden);
        }

        /// <summary>
        /// Test với User role (không có quyền delete)
        /// Expected: HTTP 403 Forbidden
        /// </summary>
        [Fact]
        public async Task SoftDeleteUser_WithUserRole_Returns403()
        {
            // Arrange - User role không có quyền delete
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");

            // Act
            var response = await client.DeleteAsync("/user/10");

            // Assert
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task SoftDeleteUser_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.DeleteAsync("/user/1");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
