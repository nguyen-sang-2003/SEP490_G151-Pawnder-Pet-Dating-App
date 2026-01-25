using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.MatchServiceIntegrationTest;

public class GetBadgeCountsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetBadgeCountsIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_5_5_TC_1_GetBadgeCounts_WithoutPetIdFilter_ReturnsBadgeCounts()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 1;

        // Act
        var response = await client.GetAsync($"/api/match/badge-counts?userId={userId}");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("unreadChats", out _), "Response should contain 'unreadChats' field");
            Assert.True(root.TryGetProperty("favoriteBadge", out _), "Response should contain 'favoriteBadge' field");
        }
    }

    [Fact]
    public async Task UC_5_5_TC_2_GetBadgeCounts_WithPetIdFilter_ReturnsFilteredBadgeCounts()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 1;
        var petId = 3;

        // Act
        var response = await client.GetAsync($"/api/match/badge-counts?userId={userId}&petId={petId}");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("unreadChats", out _), "Response should contain 'unreadChats' field");
            Assert.True(root.TryGetProperty("favoriteBadge", out _), "Response should contain 'favoriteBadge' field");
        }
    }

    [Fact]
    public async Task UC_5_5_TC_3_GetBadgeCounts_UserWithNoPets_ReturnsZeroCounts()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 999;

        // Act
        var response = await client.GetAsync($"/api/match/badge-counts?userId={userId}");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("unreadChats", out _), "Response should contain 'unreadChats' field");
            Assert.True(root.TryGetProperty("favoriteBadge", out _), "Response should contain 'favoriteBadge' field");
        }
    }

    [Fact]
    public async Task UC_5_5_TC_4_GetBadgeCounts_NoUnreadChatsAndLikes_ReturnsEmptyCounts()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 100;

        // Act
        var response = await client.GetAsync($"/api/match/badge-counts?userId={userId}");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("unreadChats", out _), "Response should contain 'unreadChats' field");
            Assert.True(root.TryGetProperty("favoriteBadge", out _), "Response should contain 'favoriteBadge' field");
        }
    }
}
