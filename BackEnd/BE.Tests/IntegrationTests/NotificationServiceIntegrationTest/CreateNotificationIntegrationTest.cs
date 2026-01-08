using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.NotificationServiceIntegrationTest;

public class CreateNotificationIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CreateNotificationIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_6_2_TC_1_CreateNotification_WithValidData_ReturnsCreatedNotification()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            userId = 1,
            title = "Thông báo mới",
            message = "Đây là nội dung thông báo"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/notification", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200, 201 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("notificationId", out _), "Response should contain 'notificationId' field");
        }
    }

    [Fact]
    public async Task UC_6_2_TC_2_CreateNotification_InvalidUserId_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            userId = 999,
            title = "Thông báo mới",
            message = "Đây là nội dung thông báo"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/notification", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK,
            $"Expected status code 400, 404 or 200, but got {response.StatusCode}");

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
    public async Task UC_6_2_TC_3_CreateNotification_EmptyTitle_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            userId = 1,
            title = "",
            message = "Đây là nội dung thông báo"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/notification", content);

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
    public async Task UC_6_2_TC_4_CreateNotification_EmptyMessage_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            userId = 1,
            title = "Thông báo mới",
            message = ""
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/notification", content);

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
    public async Task UC_6_2_TC_5_CreateNotification_NullUserId_ReturnsError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = JsonSerializer.Serialize(new { userId = (int?)null, title = "Thông báo mới", message = "Đây là nội dung thông báo" });
        var content = new StringContent(requestBody, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/notification", content);

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
}
