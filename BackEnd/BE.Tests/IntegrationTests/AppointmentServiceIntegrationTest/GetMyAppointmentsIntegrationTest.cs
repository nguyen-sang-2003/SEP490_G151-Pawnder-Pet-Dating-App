using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetMyAppointments API
/// GET /api/appointment/my-appointments
/// </summary>
public class GetMyAppointmentsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetMyAppointmentsIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_4_TC_1_GetMyAppointments_AuthenticatedUser_ReturnsList()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);

        // Act
        var response = await client.GetAsync("/api/appointment/my-appointments");

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
    public async Task UC_6_4_TC_2_GetMyAppointments_UserWithNoAppointments_ReturnsEmptyList()
    {
        // Arrange
        var client = CreateAuthenticatedClient(12); // User 12 has no appointments

        // Act
        var response = await client.GetAsync("/api/appointment/my-appointments");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var root = jsonDocument.RootElement;

        Assert.True(root.ValueKind == JsonValueKind.Array, "Response should be an array");
        Assert.Equal(0, root.GetArrayLength());
    }

    [Fact]
    public async Task UC_6_4_TC_3_GetMyAppointments_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/appointment/my-appointments");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
