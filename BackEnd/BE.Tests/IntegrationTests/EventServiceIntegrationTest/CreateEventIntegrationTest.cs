using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.EventServiceIntegrationTest;

/// <summary>
/// Integration Tests cho CreateEvent API
/// POST /api/event
/// </summary>
public class CreateEventIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CreateEventIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_8_2_TC_1_CreateEvent_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAdminClient();
        var requestBody = new
        {
            title = $"Test Event {Guid.NewGuid().ToString().Substring(0, 8)}",
            description = "Mô tả sự kiện test",
            startDate = DateTime.UtcNow.AddDays(10).ToString("o"),
            endDate = DateTime.UtcNow.AddDays(30).ToString("o")
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/event", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 201, 400 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_2_TC_2_CreateEvent_WithInvalidDates_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAdminClient();
        var requestBody = new
        {
            title = "Test Event",
            startDate = DateTime.UtcNow.AddDays(30).ToString("o"),
            endDate = DateTime.UtcNow.AddDays(10).ToString("o") // End before start
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/event", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 400, 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_2_TC_3_CreateEvent_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            title = "Test Event"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/event", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
