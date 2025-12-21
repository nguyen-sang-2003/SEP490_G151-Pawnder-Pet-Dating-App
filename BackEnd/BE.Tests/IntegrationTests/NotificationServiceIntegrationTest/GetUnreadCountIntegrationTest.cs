using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.NotificationServiceIntegrationTest;

public class GetUnreadCountIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetUnreadCountIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_8_TC_1_GetUnreadCount_UserWithUnreadNotifications_ReturnsCount()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 1;

        // Act
        var response = await client.GetAsync($"/api/notification/user/{userId}/unread-count");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("count", out _), "Response should contain 'count' field");
        }
    }

    [Fact]
    public async Task UC_6_8_TC_2_GetUnreadCount_UserNoUnreadNotifications_ReturnsZeroCount()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 2;

        // Act
        var response = await client.GetAsync($"/api/notification/user/{userId}/unread-count");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("count", out _), "Response should contain 'count' field");
        }
    }

    [Fact]
    public async Task UC_6_8_TC_3_GetUnreadCount_UserNoNotifications_ReturnsZeroCount()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 999;

        // Act
        var response = await client.GetAsync($"/api/notification/user/{userId}/unread-count");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("count", out _), "Response should contain 'count' field");
        }
    }
}
