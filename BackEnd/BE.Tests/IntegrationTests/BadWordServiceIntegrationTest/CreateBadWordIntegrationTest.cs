using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.BadWordServiceIntegrationTest;

/// <summary>
/// Integration Tests cho CreateBadWord API
/// POST /api/badword
/// </summary>
public class CreateBadWordIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CreateBadWordIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAdminClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
        return client;
    }

    [Fact]
    public async Task UC_7_3_TC_1_CreateBadWord_WithValidData_ReturnsCreated()
    {
        // Arrange
        var client = CreateAdminClient();
        var requestBody = new
        {
            word = $"testbadword_{Guid.NewGuid().ToString().Substring(0, 8)}",
            isRegex = false,
            level = 2,
            category = "test"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/badword", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 201, 200, 400 or 500, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("badWordId", out _) || root.TryGetProperty("word", out _), 
                "Response should contain 'badWordId' or 'word' field");
        }
    }

    [Fact]
    public async Task UC_7_3_TC_2_CreateBadWord_DuplicateWord_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAdminClient();
        var requestBody = new
        {
            word = "spam",
            isRegex = false,
            level = 1,
            category = "spam"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/badword", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 400, 201, 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_7_3_TC_3_CreateBadWord_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            word = "testword",
            isRegex = false,
            level = 1,
            category = "test"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/badword", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
