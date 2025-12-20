using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AttributeServiceIntegrationTest
{
    /// <summary>
    /// Integration Tests cho CreateAttribute API
    /// POST /api/attribute
    /// </summary>
    public class CreateAttributeIntegrationTest : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public CreateAttributeIntegrationTest(CustomWebApplicationFactory factory)
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

        private string GenerateUniqueName() => $"TestAttr_{Guid.NewGuid():N}".Substring(0, 20);

        #region UC-2.2 createAttribute Test Cases

        /// <summary>
        /// UC-2.2-TC-1: Create attribute with valid data
        /// Expected: 201 Created
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_1_CreateAttribute_ValidData_Returns201()
        {
            var client = CreateAdminClient();
            var request = new
            {
                Name = GenerateUniqueName(),
                TypeValue = "string",
                Unit = (string?)null,
                IsDeleted = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/attribute", content);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.Contains("Tạo thuộc tính thành công", responseContent);
        }

        /// <summary>
        /// UC-2.2-TC-2: Create attribute with unit
        /// Expected: 201 Created
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_2_CreateAttribute_WithUnit_Returns201()
        {
            var client = CreateAdminClient();
            var request = new
            {
                Name = GenerateUniqueName(),
                TypeValue = "number",
                Unit = "kg",
                IsDeleted = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/attribute", content);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-3: Create attribute with duplicate name
        /// Expected: 409 Conflict
        /// Note: Depends on seeded data or previous test
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_3_CreateAttribute_DuplicateName_Returns409Or201()
        {
            var client = CreateAdminClient();
            var uniqueName = GenerateUniqueName();
            
            // First create
            var request1 = new { Name = uniqueName, TypeValue = "string", Unit = (string?)null, IsDeleted = false };
            var content1 = new StringContent(JsonSerializer.Serialize(request1), Encoding.UTF8, "application/json");
            await client.PostAsync("/api/attribute", content1);

            // Second create with same name
            var request2 = new { Name = uniqueName, TypeValue = "string", Unit = (string?)null, IsDeleted = false };
            var content2 = new StringContent(JsonSerializer.Serialize(request2), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("/api/attribute", content2);

            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-4: Create attribute with missing name
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_4_CreateAttribute_MissingName_Returns400()
        {
            var client = CreateAdminClient();
            var request = new
            {
                TypeValue = "string",
                Unit = (string?)null,
                IsDeleted = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/attribute", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// UC-2.2-TC-5: Create attribute with name too long (> 100 chars)
        /// Expected: 400 Bad Request
        /// </summary>
        [Fact]
        public async Task UC_2_2_TC_5_CreateAttribute_NameTooLong_Returns400()
        {
            var client = CreateAdminClient();
            var longName = new string('A', 101);
            var request = new
            {
                Name = longName,
                TypeValue = "string",
                Unit = (string?)null,
                IsDeleted = false
            };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/attribute", content);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// Test: User role cannot create (Admin only)
        /// Expected: 403 Forbidden
        /// </summary>
        [Fact]
        public async Task CreateAttribute_UserRole_Returns403()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
            client.DefaultRequestHeaders.Add("X-Test-Role", "User");
            client.DefaultRequestHeaders.Add("X-Test-Email", "user@example.com");

            var request = new { Name = GenerateUniqueName(), TypeValue = "string" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/attribute", content);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        /// <summary>
        /// Test: No authentication
        /// Expected: 401 Unauthorized
        /// </summary>
        [Fact]
        public async Task CreateAttribute_NoAuth_Returns401()
        {
            var client = _factory.CreateClient();
            var request = new { Name = "Test", TypeValue = "string" };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

            var response = await client.PostAsync("/api/attribute", content);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        #endregion
    }
}
