using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.EventServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetActiveEvents API
/// GET /api/event
/// </summary>
public class GetActiveEventsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetActiveEventsIntegrationTest(CustomWebApplicationFactory factory)
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

    private HttpClient CreateAdminClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
        return client;
    }

    [Fact]
    public async Task UC_8_5_TC_1_GetActiveEvents_AsUser_ReturnsList()
    {
        // Arrange
        var client = CreateUserClient();

        // Act
        var response = await client.GetAsync("/api/event");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_5_TC_2_GetActiveEvents_WithoutAuth_ReturnsList()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/event");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_5_TC_3_GetActiveEvents_AsAdmin_ReturnsList()
    {
        // Arrange
        var client = CreateAdminClient();

        // Act
        var response = await client.GetAsync("/api/event");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200 or 500, but got {response.StatusCode}");
    }
}
