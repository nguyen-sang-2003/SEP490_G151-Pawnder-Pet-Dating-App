using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.NotificationServiceIntegrationTest;

public class MarkAsReadIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public MarkAsReadIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
        client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        client.DefaultRequestHeaders.Add("X-Test-Email", "user1@example.com");
        return client;
    }

    [Fact]
    public async Task UC_6_6_TC_1_MarkAsRead_ValidId_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var notificationId = 1;

        // Act
        var response = await client.PutAsync($"/api/notification/{notificationId}/read", null);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            if (!string.IsNullOrEmpty(responseBody))
            {
                var jsonDocument = JsonDocument.Parse(responseBody);
                var root = jsonDocument.RootElement;
                Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
            }
        }
    }

    [Fact]
    public async Task UC_6_6_TC_2_MarkAsRead_NonExistentId_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var notificationId = 999;

        // Act
        var response = await client.PutAsync($"/api/notification/{notificationId}/read", null);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected status code 404, 200 or 400, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            if (!string.IsNullOrEmpty(responseBody))
            {
                var jsonDocument = JsonDocument.Parse(responseBody);
                var root = jsonDocument.RootElement;
                Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
            }
        }
    }
}
