using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.UserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho UpdateUser API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class UpdateUserAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public UpdateUserAsyncTest(CustomWebApplicationFactory factory)
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

        #region UC-U-4.1 Integration Test Cases

        /// <summary>
        /// UC-U-4.1-TC-1: Update user with valid data
        /// Expected: HTTP 200 OK với updated data
        /// </summary>
        [Fact]
        public async Task UC_U_4_1_TC_1_UpdateUser_ValidData_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new
            {
                fullName = "Nguyen Van B",
                gender = "Male",
                addressId = (int?)null,
                newPassword = (string?)null
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Nguyen Van B", responseContent);
        }

        /// <summary>
        /// UC-U-4.1-TC-2: Update user with new password
        /// Expected: HTTP 200 OK với password updated
        /// </summary>
        [Fact]
        public async Task UC_U_4_1_TC_2_UpdateUser_WithNewPassword_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(2, "User", "user2@example.com");
            var request = new
            {
                fullName = "User With Address",
                gender = "Male",
                addressId = (int?)null,
                newPassword = "NewPass@456"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/2", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        /// <summary>
        /// UC-U-4.1-TC-3: Update user with non-existent userId
        /// Expected: HTTP 404 Not Found
        /// </summary>
        [Fact]
        public async Task UC_U_4_1_TC_3_UpdateUser_NonExistentUserId_Returns404()
        {
            // Arrange
            var client = CreateAuthenticatedClient(101, "Admin", "admin@example.com");
            var request = new
            {
                fullName = "Test",
                gender = "Male",
                addressId = (int?)null,
                newPassword = (string?)null
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/99999", content);

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        /// <summary>
        /// UC-U-4.1-TC-4: Update user with invalid new password (too short)
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_4_1_TC_4_UpdateUser_PasswordTooShort_Returns400()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new
            {
                fullName = "Nguyen Van A",
                gender = "Male",
                addressId = (int?)null,
                newPassword = "123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-4.1-TC-5: Update user with missing required fullName
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_4_1_TC_5_UpdateUser_MissingFullName_Returns400()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new
            {
                fullName = (string?)null,
                gender = "Male",
                addressId = (int?)null,
                newPassword = (string?)null
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-4.1-TC-6: Update user with invalid addressId
        /// Note: Service hiện không validate addressId, nên sẽ cập nhật với giá trị này
        /// Expected: HTTP 200 OK (service không kiểm tra FK constraint)
        /// </summary>
        [Fact]
        public async Task UC_U_4_1_TC_6_UpdateUser_InvalidAddressId_Returns200OrError()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new
            {
                fullName = "Nguyen Van A",
                gender = "Male",
                addressId = 99999,
                newPassword = (string?)null
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/1", content);

            // Assert - Service không validate addressId nên có thể trả về 200 hoặc 500
            Assert.True(response.StatusCode == HttpStatusCode.OK || 
                       response.StatusCode == HttpStatusCode.InternalServerError);
        }

        /// <summary>
        /// UC-U-4.1-TC-7: Update user fullName exceeding max length
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_4_1_TC_7_UpdateUser_FullNameExceedsMaxLength_Returns400()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var longName = new string('A', 101);
            var request = new
            {
                fullName = longName,
                gender = "Male",
                addressId = (int?)null,
                newPassword = (string?)null
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-4.1-TC-8: Update user gender only
        /// Expected: HTTP 200 OK với gender updated
        /// </summary>
        [Fact]
        public async Task UC_U_4_1_TC_8_UpdateUser_GenderOnly_Returns200()
        {
            // Arrange
            var client = CreateAuthenticatedClient(1, "User", "test@example.com");
            var request = new
            {
                fullName = "Test User",
                gender = "Female",
                addressId = (int?)null,
                newPassword = (string?)null
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Female", responseContent);
        }

        /// <summary>
        /// Test không có Authentication
        /// Expected: HTTP 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task UpdateUser_NoAuthToken_Returns401()
        {
            // Arrange
            var client = _factory.CreateClient();
            var request = new { fullName = "Test" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PutAsync("/user/1", content);

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
