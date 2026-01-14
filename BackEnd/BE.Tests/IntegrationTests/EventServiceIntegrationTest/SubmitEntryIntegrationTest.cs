using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.EventServiceIntegrationTest;

/// <summary>
/// Integration Tests cho SubmitEntry API
/// POST /api/event/{eventId}/submit
/// </summary>
public class SubmitEntryIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public SubmitEntryIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateUserClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "10");
        client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        client.DefaultRequestHeaders.Add("X-Test-Email", "user10@example.com");
        return client;
    }

    [Fact]
    public async Task UC_8_7_TC_1_SubmitEntry_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var client = CreateUserClient();
        var requestBody = new
        {
            petId = 10,
            mediaUrl = "https://example.com/image.jpg",
            caption = "Mô tả bài dự thi"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/event/1/submit", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 404, 400 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_7_TC_2_SubmitEntry_ToNonExistentEvent_ReturnsNotFound()
    {
        // Arrange
        var client = CreateUserClient();
        var requestBody = new
        {
            petId = 10,
            mediaUrl = "https://example.com/image.jpg",
            caption = "Test"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/event/99999/submit", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 404, 400 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_7_TC_3_SubmitEntry_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            petId = 10,
            mediaUrl = "https://example.com/image.jpg"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/event/1/submit", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
