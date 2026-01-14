using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetMyRecentLocations API
/// GET /api/appointment/my-locations
/// </summary>
public class GetMyRecentLocationsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetMyRecentLocationsIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient(int userId = 10)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        client.DefaultRequestHeaders.Add("X-Test-Email", $"user{userId}@example.com");
        return client;
    }

    [Fact]
    public async Task UC_6_10_TC_1_GetMyRecentLocations_WithDefaultLimit_ReturnsList()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);

        // Act
        var response = await client.GetAsync("/api/appointment/my-locations");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            $"Expected status code 200, but got {response.StatusCode}");

        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var root = jsonDocument.RootElement;

        Assert.True(root.ValueKind == JsonValueKind.Array, "Response should be an array");
    }

    [Fact]
    public async Task UC_6_10_TC_2_GetMyRecentLocations_UserWithNoLocations_ReturnsEmptyList()
    {
        // Arrange
        var client = CreateAuthenticatedClient(12); // User 12 has no locations

        // Act
        var response = await client.GetAsync("/api/appointment/my-locations");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var root = jsonDocument.RootElement;

        Assert.True(root.ValueKind == JsonValueKind.Array, "Response should be an array");
        Assert.Equal(0, root.GetArrayLength());
    }

    [Fact]
    public async Task UC_6_10_TC_3_GetMyRecentLocations_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/appointment/my-locations");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
