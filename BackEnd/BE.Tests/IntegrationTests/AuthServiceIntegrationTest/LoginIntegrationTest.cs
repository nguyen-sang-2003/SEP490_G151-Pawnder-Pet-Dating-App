using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AuthServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho Login API
    /// POST /api/login
    /// </summary>
    public class LoginIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public LoginIntegrationTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        #region UC-4.1 Login Test Cases

        /// <summary>
        /// UC-4.1-TC-1: Login with valid credentials for user platform
        /// Expected: 200 OK with tokens
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_1_Login_ValidCredentials_UserPlatform_Returns200()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "user@example.com",
                password = "Test@123",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đăng nhập thành công", responseContent);
            Assert.Contains("accessToken", responseContent, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("refreshToken", responseContent, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// UC-4.1-TC-2: Login with valid credentials for admin platform
        /// Expected: 200 OK with tokens
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_2_Login_ValidCredentials_AdminPlatform_Returns200()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "admin@example.com",
                password = "Admin@123",
                platform = "admin"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Đăng nhập thành công", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-3: Login with invalid email (non-existent)
        /// Expected: 401 Unauthorized with message "Tài khoản không tồn tại"
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_3_Login_InvalidEmail_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "nonexistent@example.com",
                password = "Test@123",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Tài khoản không tồn tại", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-4: Login with wrong password
        /// Expected: 401 Unauthorized with message "Sai mật khẩu"
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_4_Login_WrongPassword_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "user@example.com",
                password = "WrongPassword123",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Sai mật khẩu", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-5: Login with user account on admin platform
        /// Expected: 401 Unauthorized with role restriction message
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_5_Login_UserAccountOnAdminPlatform_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "user@example.com",
                password = "Test@123",
                platform = "admin"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Chỉ tài khoản Admin hoặc Expert mới có thể đăng nhập vào hệ thống quản trị", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-6: Login with admin account on user platform
        /// Expected: 401 Unauthorized with role restriction message
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_6_Login_AdminAccountOnUserPlatform_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "admin@example.com",
                password = "Admin@123",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Chỉ tài khoản User mới có thể đăng nhập vào ứng dụng này", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-7: Login with empty email
        /// Expected: 400 Bad Request with validation error
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_7_Login_EmptyEmail_Returns400()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "",
                password = "Test@123",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Email không được để trống", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-8: Login with invalid email format
        /// Expected: 400 Bad Request with validation error
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_8_Login_InvalidEmailFormat_Returns400()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "invalid-email",
                password = "Test@123",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Email không hợp lệ", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-9: Login with empty password
        /// Expected: 400 Bad Request with validation error
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_9_Login_EmptyPassword_Returns400()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "user@example.com",
                password = "",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Mật khẩu không được để trống", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-10: Login with password too short
        /// Expected: 400 Bad Request with validation error
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_10_Login_PasswordTooShort_Returns400()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "user@example.com",
                password = "12345",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Mật khẩu phải ít nhất 6 ký tự", responseContent);
        }

        /// <summary>
        /// UC-4.1-TC-11: Login with banned account
        /// Expected: 403 Forbidden with ban details
        /// </summary>
        [Fact]
        public async Task UC_4_1_TC_11_Login_BannedAccount_Returns403()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                email = "banned@example.com",
                password = "Test@123",
                platform = "user"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/login", content);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Tài khoản đang bị khóa tạm thời", responseContent);
        }

        #endregion
    }
}
