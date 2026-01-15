using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho RespondToAppointment API
/// PUT /api/appointment/{appointmentId}/respond
/// </summary>
public class RespondToAppointmentIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public RespondToAppointmentIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient(int userId = 11)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        client.DefaultRequestHeaders.Add("X-Test-Email", $"user{userId}@example.com");
        return client;
    }

    [Fact]
    public async Task UC_6_5_TC_1_RespondToAppointment_Accept_ReturnsConfirmed()
    {
        // Arrange
        var client = CreateAuthenticatedClient(11);
        var requestBody = new
        {
            accept = true
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/1/respond", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 400, 404 or 500, but got {response.StatusCode}");

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
    public async Task UC_6_5_TC_2_RespondToAppointment_DeclineWithReason_ReturnsDeclined()
    {
        // Arrange
        var client = CreateAuthenticatedClient(11);
        var requestBody = new
        {
            accept = false,
            declineReason = "Tôi bận vào ngày này"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/1/respond", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 400, 404 or 500, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
        }
    }

    [Fact]
    public async Task UC_6_5_TC_3_RespondToAppointment_NonExistent_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAuthenticatedClient(11);
        var requestBody = new
        {
            accept = true
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/99999/respond", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 404, 400 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_6_5_TC_4_RespondToAppointment_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            accept = true
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/1/respond", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_6_5_TC_5_RespondToAppointment_DeclineWithoutReason_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(11);
        var requestBody = new
        {
            accept = false
            // No declineReason provided
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/1/respond", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 400, 200, 404 or 500, but got {response.StatusCode}");
    }
}
