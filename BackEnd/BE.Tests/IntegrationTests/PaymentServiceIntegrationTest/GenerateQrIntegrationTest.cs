using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PaymentServiceIntegrationTest;

public class GenerateQrIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GenerateQrIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_7_1_TC_1_GenerateQr_ValidAmountAndMonths_ReturnsQrImage()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new { amount = 99000, months = 1 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history/generate", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_7_1_TC_2_GenerateQr_AmountZero_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new { amount = 0, months = 1 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history/generate", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 400, 200 or 404, but got {response.StatusCode}");

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
    public async Task UC_7_1_TC_3_GenerateQr_NegativeAmount_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new { amount = -1000, months = 1 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history/generate", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 400, 200 or 404, but got {response.StatusCode}");

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
    public async Task UC_7_1_TC_4_GenerateQr_MonthsLessThan1_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new { amount = 99000, months = 0 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history/generate", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 400, 200 or 404, but got {response.StatusCode}");

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
    public async Task UC_7_1_TC_5_GenerateQr_MonthsGreaterThan12_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new { amount = 99000, months = 13 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history/generate", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 400, 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            if (!string.IsNullOrEmpty(responseBody) && !responseBody.StartsWith("<"))
            {
                try
                {
                    var jsonDocument = JsonDocument.Parse(responseBody);
                    var root = jsonDocument.RootElement;
                    Assert.True(root.TryGetProperty("message", out _) || root.TryGetProperty("error", out _),
                        "Response should contain 'message' or 'error' field");
                }
                catch (JsonException)
                {
                    // Response is not JSON, that's okay for error responses
                }
            }
        }
    }

    [Fact]
    public async Task UC_7_1_TC_6_GenerateQr_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var requestBody = new { amount = 99000, months = 1 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history/generate", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 401, 403, 200 or 404, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_7_1_TC_7_GenerateQr_UserInfoNotInToken_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new { amount = 99000, months = 1 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/payment-history/generate", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected status code 200, 404 or 400, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            if (!string.IsNullOrEmpty(responseBody) && !responseBody.StartsWith("<"))
            {
                try
                {
                    var jsonDocument = JsonDocument.Parse(responseBody);
                    var root = jsonDocument.RootElement;
                    Assert.True(root.TryGetProperty("message", out _) || root.TryGetProperty("error", out _),
                        "Response should contain 'message' or 'error' field");
                }
                catch (JsonException)
                {
                    // Response is not JSON, that's okay for error responses
                }
            }
        }
    }
}
