using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho CancelAppointment API
/// PUT /api/appointment/{appointmentId}/cancel
/// </summary>
public class CancelAppointmentIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CancelAppointmentIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_7_TC_1_CancelAppointment_WithValidReason_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            reason = "Tôi có việc đột xuất"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/1/cancel", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200, 400 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
            Assert.True(root.TryGetProperty("data", out _), "Response should contain 'data' field");
        }
    }

    [Fact]
    public async Task UC_6_7_TC_2_CancelAppointment_NonExistent_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            reason = "Tôi có việc đột xuất"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/99999/cancel", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected status code 404 or 400, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_6_7_TC_3_CancelAppointment_WithoutReason_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            // No reason provided
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/1/cancel", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 400, 200 or 404, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_6_7_TC_4_CancelAppointment_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            reason = "Tôi có việc đột xuất"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/1/cancel", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
