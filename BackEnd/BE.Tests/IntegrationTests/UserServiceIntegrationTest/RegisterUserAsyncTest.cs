using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.UserServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho Register API
    /// Sử dụng HttpClient để gọi API thực sự qua WebApplicationFactory
    /// </summary>
    public class RegisterUserAsyncTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public RegisterUserAsyncTest(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        #region UC-U-2.1 Integration Test Cases

        /// <summary>
        /// UC-U-2.1-TC-1: Register with valid data
        /// Expected: HTTP 201 Created với user data
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_1_Register_ValidData_Returns201()
        {
            // Arrange
            var client = _factory.CreateClient();
            var uniqueEmail = $"newuser_{Guid.NewGuid():N}@example.com";
            var request = new
            {
                fullName = "Nguyen Van Test",
                gender = "Male",
                email = uniqueEmail,
                password = "Test@123",
                providerLogin = (string?)null,
                isDelete = false,
                isProfileComplete = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains(uniqueEmail, responseContent);
        }

        /// <summary>
        /// UC-U-2.1-TC-2: Register with duplicate email
        /// Expected: HTTP 409 Conflict với message "Email đã tồn tại"
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_2_Register_DuplicateEmail_Returns409()
        {
            // Arrange - email "user@example.com" đã tồn tại trong seed data
            var client = _factory.CreateClient();
            var request = new
            {
                fullName = "Test User",
                gender = "Male",
                email = "user@example.com",
                password = "Test@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Email", responseContent);
        }

        /// <summary>
        /// UC-U-2.1-TC-3: Register with invalid email format
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_3_Register_InvalidEmailFormat_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var request = new
            {
                fullName = "Test User",
                gender = "Male",
                email = "invalid-email",
                password = "Test@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-2.1-TC-4: Register with password too short
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_4_Register_PasswordTooShort_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var request = new
            {
                fullName = "Test User",
                gender = "Male",
                email = "newuser@example.com",
                password = "12345"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-2.1-TC-5: Register with missing required fullName
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_5_Register_MissingFullName_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var request = new
            {
                fullName = (string?)null,
                gender = "Male",
                email = "newuser@example.com",
                password = "Test@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-2.1-TC-6: Register with missing required email
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_6_Register_MissingEmail_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var request = new
            {
                fullName = "Test User",
                gender = "Male",
                email = (string?)null,
                password = "Test@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-2.1-TC-7: Register with missing required password
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_7_Register_MissingPassword_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var request = new
            {
                fullName = "Test User",
                gender = "Male",
                email = "newuser@example.com",
                password = (string?)null
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-2.1-TC-8: Register with provider login (OAuth)
        /// Expected: HTTP 201 Created với provider info
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_8_Register_WithProviderLogin_Returns201()
        {
            // Arrange
            var client = _factory.CreateClient();
            var uniqueEmail = $"google_{Guid.NewGuid():N}@example.com";
            var request = new
            {
                fullName = "Google User",
                gender = "Female",
                email = uniqueEmail,
                password = "Test@123",
                providerLogin = "google"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("google", responseContent.ToLower());
        }

        /// <summary>
        /// UC-U-2.1-TC-9: Register with fullName exceeding max length
        /// Expected: HTTP 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_9_Register_FullNameExceedsMaxLength_Returns400()
        {
            // Arrange
            var client = _factory.CreateClient();
            var longName = new string('A', 101); // Exceeds 100 char limit
            var request = new
            {
                fullName = longName,
                gender = "Male",
                email = "newuser@example.com",
                password = "Test@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-U-2.1-TC-10: Register with empty gender (allowed)
        /// Expected: HTTP 201 Created với gender null
        /// </summary>
        [Fact]
        public async Task UC_U_2_1_TC_10_Register_EmptyGender_Returns201()
        {
            // Arrange
            var client = _factory.CreateClient();
            var uniqueEmail = $"nogender_{Guid.NewGuid():N}@example.com";
            var request = new
            {
                fullName = "Test User",
                gender = (string?)null,
                email = uniqueEmail,
                password = "Test@123"
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/user", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        #endregion
    }
}
