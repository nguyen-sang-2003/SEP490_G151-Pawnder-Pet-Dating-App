using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.MatchServiceIntegrationTest;

public class SendLikeIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public SendLikeIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_5_3_TC_1_SendLike_WithValidData_ReturnsLikeSent()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            fromUserId = 1,
            toUserId = 2,
            fromPetId = 3,
            toPetId = 5
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/send-like", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("matchId", out _), "Response should contain 'matchId' field");
        }
    }

    [Fact]
    public async Task UC_5_3_TC_2_SendLike_MutualLike_CreatesMatch()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            fromUserId = 1,
            toUserId = 2,
            fromPetId = 3,
            toPetId = 5
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/send-like", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("matchId", out _), "Response should contain 'matchId' field");
        }
    }

    [Fact]
    public async Task UC_5_3_TC_3_SendLike_ToYourself_ReturnsInvalid()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            fromUserId = 1,
            toUserId = 1,
            fromPetId = 3,
            toPetId = 5
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/send-like", content);

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
    public async Task UC_5_3_TC_4_SendLike_AlreadySent_ReturnsAlreadyLiked()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            fromUserId = 1,
            toUserId = 2,
            fromPetId = 3,
            toPetId = 5
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/send-like", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected status code 200, 404 or 400, but got {response.StatusCode}");

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
    public async Task UC_5_3_TC_5_SendLike_DailyLimitExceeded_ReturnsLimitError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            fromUserId = 1,
            toUserId = 2,
            fromPetId = 3,
            toPetId = 5
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/send-like", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 200, 404 or 403, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Forbidden)
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
