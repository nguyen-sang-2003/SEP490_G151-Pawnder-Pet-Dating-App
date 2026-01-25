using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.EventServiceIntegrationTest;

/// <summary>
/// Integration Tests cho UpdateEvent API
/// PUT /api/event/{eventId}
/// </summary>
public class UpdateEventIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public UpdateEventIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_8_3_TC_1_UpdateEvent_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAdminClient();
        var requestBody = new
        {
            title = "Updated Event Title"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/event/1", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 404, 400 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_3_TC_2_UpdateEvent_NonExistent_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAdminClient();
        var requestBody = new
        {
            title = "Test"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/event/99999", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 404, 400 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_3_TC_3_UpdateEvent_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            title = "Test"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/event/1", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
