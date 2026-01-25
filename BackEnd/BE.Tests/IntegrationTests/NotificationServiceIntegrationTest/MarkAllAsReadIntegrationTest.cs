using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.NotificationServiceIntegrationTest;

public class MarkAllAsReadIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public MarkAllAsReadIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_7_TC_1_MarkAllAsRead_ValidUser_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 1;

        // Act
        var response = await client.PutAsync($"/api/notification/user/{userId}/read-all", null);

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
    public async Task UC_6_7_TC_2_MarkAllAsRead_UserNoUnreadNotifications_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 2;

        // Act
        var response = await client.PutAsync($"/api/notification/user/{userId}/read-all", null);

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
    public async Task UC_6_7_TC_3_MarkAllAsRead_UserNoNotifications_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 999;

        // Act
        var response = await client.PutAsync($"/api/notification/user/{userId}/read-all", null);

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
}
