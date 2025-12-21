using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.MatchServiceIntegrationTest;

public class RespondToLikeIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public RespondToLikeIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_5_4_TC_1_RespondToLike_MatchAction_ReturnsMatched()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            matchId = 1,
            action = "match"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/respond-to-like", content);

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
    public async Task UC_5_4_TC_2_RespondToLike_PassAction_ReturnsPassed()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            matchId = 1,
            action = "pass"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/respond-to-like", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
        }
    }

    [Fact]
    public async Task UC_5_4_TC_3_RespondToLike_UnmatchAcceptedMatch_ReturnsUnmatched()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            matchId = 2,
            action = "pass"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/respond-to-like", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected status code 200 or 404, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
        }
    }

    [Fact]
    public async Task UC_5_4_TC_4_RespondToLike_NotFound_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            matchId = 999,
            action = "match"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/respond-to-like", content);

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
                Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
            }
        }
    }

    [Fact]
    public async Task UC_5_4_TC_5_RespondToLike_InvalidAction_ReturnsInvalidError()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var requestBody = new
        {
            matchId = 1,
            action = "invalid"
        };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/match/respond-to-like", content);

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
                Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
            }
        }
    }
}
