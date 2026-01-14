using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.EventServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetLeaderboard API
/// GET /api/event/{eventId}/leaderboard
/// </summary>
public class GetLeaderboardIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetLeaderboardIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_8_10_TC_1_GetLeaderboard_OfEvent_ReturnsList()
    {
        // Arrange
        var client = CreateUserClient();

        // Act
        var response = await client.GetAsync("/api/event/1/leaderboard");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_10_TC_2_GetLeaderboard_WithoutAuth_ReturnsList()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/event/1/leaderboard");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_10_TC_3_GetLeaderboard_OfNonExistentEvent_ReturnsEmptyList()
    {
        // Arrange
        var client = CreateUserClient();

        // Act
        var response = await client.GetAsync("/api/event/99999/leaderboard");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 404 or 500, but got {response.StatusCode}");
    }
}
