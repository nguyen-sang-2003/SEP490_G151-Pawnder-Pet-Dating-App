using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetAppointmentsByMatch API
/// GET /api/appointment/by-match/{matchId}
/// </summary>
public class GetAppointmentsByMatchIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetAppointmentsByMatchIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_3_TC_1_GetAppointmentsByMatch_ValidMatchId_ReturnsList()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);

        // Act
        var response = await client.GetAsync("/api/appointment/by-match/10");

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
    public async Task UC_6_3_TC_2_GetAppointmentsByMatch_InvalidMatchId_ReturnsEmptyList()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);

        // Act
        var response = await client.GetAsync("/api/appointment/by-match/99999");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var root = jsonDocument.RootElement;

        Assert.True(root.ValueKind == JsonValueKind.Array, "Response should be an array");
        Assert.Equal(0, root.GetArrayLength());
    }

    [Fact]
    public async Task UC_6_3_TC_3_GetAppointmentsByMatch_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/appointment/by-match/10");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
