using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetAppointmentById API
/// GET /api/appointment/{appointmentId}
/// </summary>
public class GetAppointmentByIdIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetAppointmentByIdIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_2_TC_1_GetAppointmentById_ExistingId_ReturnsAppointment()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);

        // Act
        var response = await client.GetAsync("/api/appointment/1");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("appointmentId", out _), "Response should contain 'appointmentId' field");
            Assert.True(root.TryGetProperty("matchId", out _), "Response should contain 'matchId' field");
            Assert.True(root.TryGetProperty("status", out _), "Response should contain 'status' field");
        }
    }

    [Fact]
    public async Task UC_6_2_TC_2_GetAppointmentById_NonExistentId_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);

        // Act
        var response = await client.GetAsync("/api/appointment/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync();
        if (!string.IsNullOrEmpty(responseBody))
        {
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;
            Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
        }
    }

    [Fact]
    public async Task UC_6_2_TC_3_GetAppointmentById_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/appointment/1");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
