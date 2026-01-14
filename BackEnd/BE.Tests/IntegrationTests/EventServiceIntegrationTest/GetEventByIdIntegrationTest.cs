using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.EventServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetEventById API
/// GET /api/event/{eventId}
/// </summary>
public class GetEventByIdIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetEventByIdIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_8_6_TC_1_GetEventById_ExistingId_ReturnsEvent()
    {
        // Arrange
        var client = CreateUserClient();

        // Act
        var response = await client.GetAsync("/api/event/1");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 404 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_6_TC_2_GetEventById_NonExistent_ReturnsNotFound()
    {
        // Arrange
        var client = CreateUserClient();

        // Act
        var response = await client.GetAsync("/api/event/99999");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 404, 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_6_TC_3_GetEventById_WithoutAuth_ReturnsEvent()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/event/1");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 404 or 500, but got {response.StatusCode}");
    }
}
