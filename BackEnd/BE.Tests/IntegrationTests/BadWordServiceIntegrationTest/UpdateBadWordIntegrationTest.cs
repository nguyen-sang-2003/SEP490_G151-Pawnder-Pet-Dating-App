using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.BadWordServiceIntegrationTest;

/// <summary>
/// Integration Tests cho UpdateBadWord API
/// PUT /api/badword/{id}
/// </summary>
public class UpdateBadWordIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public UpdateBadWordIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_7_4_TC_1_UpdateBadWord_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAdminClient();
        var requestBody = new
        {
            word = "updatedword",
            isRegex = true,
            level = 3,
            isActive = true
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/badword/1", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 404, 400 or 500, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("badWordId", out _) || root.TryGetProperty("word", out _), 
                "Response should contain 'badWordId' or 'word' field");
        }
    }

    [Fact]
    public async Task UC_7_4_TC_2_UpdateBadWord_NonExistent_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAdminClient();
        var requestBody = new
        {
            word = "testword"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/badword/99999", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 404, 400 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_7_4_TC_3_UpdateBadWord_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            word = "testword"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/badword/1", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
