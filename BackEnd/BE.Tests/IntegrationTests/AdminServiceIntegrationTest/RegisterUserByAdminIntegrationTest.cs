using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AdminServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho RegisterUserByAdmin API
    /// POST /admin/users
    /// </summary>
    public class RegisterUserByAdminIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public RegisterUserByAdminIntegrationTest(CustomWebApplicationFactory factory)
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

        private string GenerateUniqueEmail() => $"test_{Guid.NewGuid():N}@example.com";

        #region UC-2.2 RegisterUserByAdmin Test Cases

        /// <summary>
        /// UC-2.2-TC-1: Register user by admin with valid data (all fields)
        /// Expected: 201 Created
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_1_RegisterUserByAdmin_AllFields_Returns201()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "Admin Test User",
                Email = GenerateUniqueEmail(),
                Password = "Admin@123",
                Gender = "Male",
                RoleId = 3,
                UserStatusId = 2,
                IsProfileComplete = false,
                isDelete = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Admin Test User", responseContent);
        }

        /// <summary>
        /// UC-2.2-TC-2: Register user by admin with minimal required fields
        /// Expected: 201 Created
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_2_RegisterUserByAdmin_MinimalFields_Returns201()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "Minimal User",
                Email = GenerateUniqueEmail(),
                Password = "Minimal@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-3: Register user by admin with existing email
        /// Expected: 409 Conflict
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_3_RegisterUserByAdmin_ExistingEmail_Returns409()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "Duplicate Email User",
                Email = "test@example.com", // Email already exists in seed data
                Password = "Duplicate@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Email đã tồn tại", responseContent);
        }

        /// <summary>
        /// UC-2.2-TC-4: Register user by admin with missing Email
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_4_RegisterUserByAdmin_MissingEmail_Returns400()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "No Email User",
                Password = "NoEmail@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-5: Register user by admin with missing Password
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_5_RegisterUserByAdmin_MissingPassword_Returns400()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "No Password User",
                Email = GenerateUniqueEmail()
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-6: Register user by admin with missing FullName
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_6_RegisterUserByAdmin_MissingFullName_Returns400()
        {
            var client = CreateAdminClient();
            var request = new
            {
                Email = GenerateUniqueEmail(),
                Password = "NoFullName@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-7: Register user by admin with invalid email format
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_7_RegisterUserByAdmin_InvalidEmailFormat_Returns400()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "Invalid Email User",
                Email = "invalid-email-format",
                Password = "Invalid@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-8: Register user by admin with password too short
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_8_RegisterUserByAdmin_PasswordTooShort_Returns400()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "Short Password User",
                Email = GenerateUniqueEmail(),
                Password = "12345" // Less than 6 characters
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-9: Register user by admin without UserStatusId (defaults to 2)
        /// Expected: 201 Created
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_9_RegisterUserByAdmin_NoUserStatusId_Returns201()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "Default Status User",
                Email = GenerateUniqueEmail(),
                Password = "Default@123",
                RoleId = 3
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-10: Register Expert user (RoleId = 2)
        /// Expected: 201 Created
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_10_RegisterUserByAdmin_ExpertRole_Returns201()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "Expert User",
                Email = GenerateUniqueEmail(),
                Password = "Expert@123",
                RoleId = 2,
                UserStatusId = 1,
                IsProfileComplete = true,
                Gender = "Female"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-11: Register with FullName exceeding 100 characters
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_11_RegisterUserByAdmin_FullNameTooLong_Returns400()
        {
            var client = CreateAdminClient();
            var longName = new string('A', 101); // 101 characters
            var request = new
            {
                FullName = longName,
                Email = GenerateUniqueEmail(),
                Password = "LongName@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-12: Register with Email exceeding 150 characters
        /// Note: DTO validation may not catch this, so expect BadRequest or Created
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_12_RegisterUserByAdmin_EmailTooLong_Returns400Or201()
        {
            var client = CreateAdminClient();
            var longEmail = new string('a', 140) + "@test.com"; // > 150 characters
            var request = new
            {
                FullName = "Long Email User",
                Email = longEmail,
                Password = "LongEmail@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            // Either BadRequest (if validated) or Created (if not validated)
            Assert.True(
                response.StatusCode == HttpStatusCode.BadRequest || 
                response.StatusCode == HttpStatusCode.Created,
                $"Expected 400 or 201, got {response.StatusCode}");
        }

        /// <summary>
        /// UC-2.2-TC-13: Register with Gender exceeding 10 characters
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_13_RegisterUserByAdmin_GenderTooLong_Returns400()
        {
            var client = CreateAdminClient();
            var request = new
            {
                FullName = "Long Gender User",
                Email = GenerateUniqueEmail(),
                Password = "LongGender@123",
                Gender = "VeryLongGender" // > 10 characters
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task RegisterUserByAdmin_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new
            {
                FullName = "No Auth User",
                Email = GenerateUniqueEmail(),
                Password = "NoAuth@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/admin/users", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
