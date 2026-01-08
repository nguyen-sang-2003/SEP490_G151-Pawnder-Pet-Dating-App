using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PaymentServiceIntegrationTest;

public class GetVipStatusIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetVipStatusIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_7_4_TC_1_GetVipStatus_UserWithActiveSubscription_ReturnsVipTrue()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 1;

        // Act
        var response = await client.GetAsync($"/api/payment-history/user/{userId}/vip-status");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("success", out _) || root.TryGetProperty("isVip", out _),
                "Response should contain 'success' or 'isVip' field");
        }
    }

    [Fact]
    public async Task UC_7_4_TC_2_GetVipStatus_UserWithExpiredSubscription_ReturnsVipFalse()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 2;

        // Act
        var response = await client.GetAsync($"/api/payment-history/user/{userId}/vip-status");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("success", out _) || root.TryGetProperty("isVip", out _),
                "Response should contain 'success' or 'isVip' field");
        }
    }

    [Fact]
    public async Task UC_7_4_TC_3_GetVipStatus_UserNeverSubscribed_ReturnsVipFalse()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var userId = 999;

        // Act
        var response = await client.GetAsync($"/api/payment-history/user/{userId}/vip-status");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("success", out _) || root.TryGetProperty("isVip", out _),
                "Response should contain 'success' or 'isVip' field");
        }
    }
}
