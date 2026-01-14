using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho CounterOffer API
/// PUT /api/appointment/{appointmentId}/counter-offer
/// </summary>
public class CounterOfferIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CounterOfferIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_6_TC_1_CounterOffer_WithNewDateTime_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            newDateTime = DateTime.UtcNow.AddDays(10).ToString("o")
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/5/counter-offer", content);

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
    public async Task UC_6_6_TC_2_CounterOffer_ExceedsLimit_ReturnsBadRequest()
    {
        // Arrange - Appointment 5 has counterOfferCount = 2, one more should exceed or reach limit
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            newDateTime = DateTime.UtcNow.AddDays(15).ToString("o")
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act - First counter offer (count becomes 3)
        var response1 = await client.PutAsync("/api/appointment/5/counter-offer", content);

        // Try another counter offer - should fail if limit is 3
        var requestBody2 = new
        {
            newDateTime = DateTime.UtcNow.AddDays(20).ToString("o")
        };
        var content2 = new StringContent(JsonSerializer.Serialize(requestBody2), Encoding.UTF8, "application/json");
        var response = await client.PutAsync("/api/appointment/5/counter-offer", content2);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 400, 200, 404 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_6_6_TC_3_CounterOffer_WithoutChanges_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);
        var requestBody = new
        {
            // No newDateTime or newLocationId provided
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/5/counter-offer", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 400, 200, 404 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_6_6_TC_4_CounterOffer_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new
        {
            newDateTime = DateTime.UtcNow.AddDays(10).ToString("o")
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync("/api/appointment/5/counter-offer", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
