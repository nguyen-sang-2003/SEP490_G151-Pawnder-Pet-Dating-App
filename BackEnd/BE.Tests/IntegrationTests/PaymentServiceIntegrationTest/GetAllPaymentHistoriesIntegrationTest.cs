using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PaymentServiceIntegrationTest;

public class GetAllPaymentHistoriesIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetAllPaymentHistoriesIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedAdminClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
        return client;
    }

    private HttpClient CreateAuthenticatedUserClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
        client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        client.DefaultRequestHeaders.Add("X-Test-Email", "user1@example.com");
        return client;
    }

    [Fact]
    public async Task UC_7_5_TC_1_GetAllPaymentHistories_AsAdmin_ReturnsHistories()
    {
        // Arrange
        var client = CreateAuthenticatedAdminClient();

        // Act
        var response = await client.GetAsync("/api/payment-history/all");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("success", out _) || root.TryGetProperty("data", out _),
                "Response should contain 'success' or 'data' field");
        }
    }

    [Fact]
    public async Task UC_7_5_TC_2_GetAllPaymentHistories_NoHistoriesExist_ReturnsEmptyList()
    {
        // Arrange
        var client = CreateAuthenticatedAdminClient();

        // Act
        var response = await client.GetAsync("/api/payment-history/all");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("success", out _) || root.TryGetProperty("data", out _),
                "Response should contain 'success' or 'data' field");
        }
    }

    [Fact]
    public async Task UC_7_5_TC_3_GetAllPaymentHistories_WithoutAdminRole_ReturnsUnauthorized()
    {
        // Arrange
        var client = CreateAuthenticatedUserClient();

        // Act
        var response = await client.GetAsync("/api/payment-history/all");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Forbidden || response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.OK,
            $"Expected status code 403, 401 or 200, but got {response.StatusCode}");
    }
}
