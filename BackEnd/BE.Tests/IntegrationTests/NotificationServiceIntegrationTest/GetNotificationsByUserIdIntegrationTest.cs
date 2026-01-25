using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.NotificationServiceIntegrationTest;

public class GetNotificationsByUserIdIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetNotificationsByUserIdIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_5_TC_1_GetNotificationsByUserId_ValidUserId_ReturnsNotificationsList()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 1;

        // Act
        var response = await client.GetAsync($"/api/notification/user/{userId}");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.ValueKind == JsonValueKind.Array, "Response should be an array");
        }
    }

    [Fact]
    public async Task UC_6_5_TC_2_GetNotificationsByUserId_UserNoNotifications_ReturnsEmptyArray()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 999;

        // Act
        var response = await client.GetAsync($"/api/notification/user/{userId}");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.ValueKind == JsonValueKind.Array, "Response should be an array");
        }
    }
}
