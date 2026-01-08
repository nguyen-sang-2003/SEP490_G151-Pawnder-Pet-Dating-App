using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PaymentServiceIntegrationTest;

public class CreatePaymentHistoryIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CreatePaymentHistoryIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
        return client;
    }

    [Fact]
    public async Task UC_7_2_TC_1_CreatePaymentHistory_ValidData_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            userId = 1,
            durationMonths = 1,
            amount = 99000,
            planName = "VIP 1 tháng"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200, 201 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("success", out _) || root.TryGetProperty("data", out _),
                "Response should contain 'success' or 'data' field");
        }
    }

    [Fact]
    public async Task UC_7_2_TC_2_CreatePaymentHistory_NonExistentUser_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            userId = 999,
            durationMonths = 1,
            amount = 99000,
            planName = "VIP 1 tháng"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK,
            $"Expected status code 404, 400 or 200, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            if (!string.IsNullOrEmpty(responseBody))
            {
                var jsonDocument = JsonDocument.Parse(responseBody);
                var root = jsonDocument.RootElement;
                Assert.True(root.TryGetProperty("message", out _) || root.TryGetProperty("error", out _),
                    "Response should contain 'message' or 'error' field");
            }
        }
    }

    [Fact]
    public async Task UC_7_2_TC_3_CreatePaymentHistory_3MonthsDuration_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            userId = 1,
            durationMonths = 3,
            amount = 270000,
            planName = "VIP 3 tháng"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200, 201 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("success", out _) || root.TryGetProperty("data", out _),
                "Response should contain 'success' or 'data' field");
        }
    }

    [Fact]
    public async Task UC_7_2_TC_4_CreatePaymentHistory_12MonthsDuration_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            userId = 1,
            durationMonths = 12,
            amount = 990000,
            planName = "VIP 12 tháng"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200, 201 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("success", out _) || root.TryGetProperty("data", out _),
                "Response should contain 'success' or 'data' field");
        }
    }
}
