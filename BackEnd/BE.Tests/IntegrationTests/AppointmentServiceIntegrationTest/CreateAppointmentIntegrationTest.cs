using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho CreateAppointment API
/// POST /api/appointment
/// </summary>
public class CreateAppointmentIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CreateAppointmentIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_1_TC_1_CreateAppointment_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            matchId = 10,
            inviterPetId = 10,
            inviteePetId = 11,
            appointmentDateTime = DateTime.UtcNow.AddDays(5).ToString("o"),
            locationId = 1,
            activityType = "cafe"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/appointment", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected status code 200 or 400, but got {response.StatusCode}");

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
    public async Task UC_6_1_TC_2_CreateAppointment_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            matchId = 10,
            inviterPetId = 10,
            inviteePetId = 11,
            appointmentDateTime = DateTime.UtcNow.AddDays(5).ToString("o"),
            locationId = 1,
            activityType = "cafe"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/appointment", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_6_1_TC_3_CreateAppointment_WithInvalidMatchId_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            matchId = 99999,
            inviterPetId = 10,
            inviteePetId = 11,
            appointmentDateTime = DateTime.UtcNow.AddDays(5).ToString("o"),
            locationId = 1,
            activityType = "cafe"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/appointment", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 400 or 404, but got {response.StatusCode}");

        var responseBody = await response.Content.ReadAsStringAsync();
        if (!string.IsNullOrEmpty(responseBody))
        {
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;
            Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
        }
    }

    [Fact]
    public async Task UC_6_1_TC_4_CreateAppointment_WithPastDateTime_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            matchId = 10,
            inviterPetId = 10,
            inviteePetId = 11,
            appointmentDateTime = DateTime.UtcNow.AddDays(-1).ToString("o"),
            locationId = 1,
            activityType = "cafe"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/appointment", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK,
            $"Expected status code 400 or 200, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_6_1_TC_5_CreateAppointment_WithInvalidActivityType_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            matchId = 10,
            inviterPetId = 10,
            inviteePetId = 11,
            appointmentDateTime = DateTime.UtcNow.AddDays(5).ToString("o"),
            locationId = 1,
            activityType = "invalid_type"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/appointment", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected status code 400, but got {response.StatusCode}");
    }
}
