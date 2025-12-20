using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AdminServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho UpdateUserByAdmin API
    /// PUT /admin/users/{id}
    /// </summary>
    public class UpdateUserByAdminIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UpdateUserByAdminIntegrationTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        private HttpClient CreateAdminClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "100");
            client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
            client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
            return client;
        }

        #region UC-2.1 UpdateUserByAdmin Test Cases

        /// <summary>
        /// UC-2.1-TC-1: Update user by admin with valid userId and isDelete flag
        /// Expected: 200 OK
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_1_UpdateUserByAdmin_ValidUserId_IsDeleteTrue_Returns200()
        {
            var client = CreateAdminClient();
            var request = new { isDelete = true };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/1", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật người dùng thành công", responseContent);
        }

        /// <summary>
        /// UC-2.1-TC-2: Update user by admin with valid userId and userStatusId
        /// Expected: 200 OK
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_2_UpdateUserByAdmin_ValidUserId_UserStatusId_Returns200()
        {
            var client = CreateAdminClient();
            var request = new { userStatusId = 1 };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/1", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật người dùng thành công", responseContent);
        }

        /// <summary>
        /// UC-2.1-TC-3: Update user by admin with both isDelete and userStatusId
        /// Expected: 200 OK
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_3_UpdateUserByAdmin_BothFields_Returns200()
        {
            var client = CreateAdminClient();
            var request = new { isDelete = false, userStatusId = 2 };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/1", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật người dùng thành công", responseContent);
        }

        /// <summary>
        /// UC-2.1-TC-4: Update user by admin with invalid userId (user not found)
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_4_UpdateUserByAdmin_UserNotFound_Returns404()
        {
            var client = CreateAdminClient();
            var request = new { isDelete = true };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/99999", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Không tìm thấy user", responseContent);
        }

        /// <summary>
        /// UC-2.1-TC-5: Update user by admin with negative userId
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_5_UpdateUserByAdmin_NegativeUserId_Returns404()
        {
            var client = CreateAdminClient();
            var request = new { isDelete = true };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/-1", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-2.1-TC-6: Update user by admin with zero userId
        /// Expected: 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_6_UpdateUserByAdmin_ZeroUserId_Returns404()
        {
            var client = CreateAdminClient();
            var request = new { userStatusId = 1 };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/0", content);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-2.1-TC-7: Update user by admin with empty request body (all null)
        /// Expected: 200 OK (no changes but successful)
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_7_UpdateUserByAdmin_EmptyBody_Returns200()
        {
            var client = CreateAdminClient();
            var request = new { isDelete = (bool?)null, userStatusId = (int?)null, RoleId = (int?)null };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/1", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-2.1-TC-8: Update user by admin with only RoleId
        /// Expected: 200 OK
        /// </summary>
        [Fact]
        public async Task UC_2_1_TC_8_UpdateUserByAdmin_OnlyRoleId_Returns200()
        {
            var client = CreateAdminClient();
            var request = new { RoleId = 2 };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/1", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Cập nhật người dùng thành công", responseContent);
        }

        /// <summary>
        /// Test: No authorization (not Admin role)
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task UpdateUserByAdmin_NotAdminRole_Returns403()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
            client.DefaultRequestHeaders.Add("X-Test-Role", "User"); // Not Admin
            client.DefaultRequestHeaders.Add("X-Test-Email", "user@example.com");

            var request = new { isDelete = true };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/1", content);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UpdateUserByAdmin_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { isDelete = true };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PutAsync("/admin/users/1", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
