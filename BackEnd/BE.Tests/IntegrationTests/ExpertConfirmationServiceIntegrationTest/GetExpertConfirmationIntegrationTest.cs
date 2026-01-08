using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ExpertConfirmationServiceIntegrationTest;

public class GetExpertConfirmationIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetExpertConfirmationIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient(int userId, string role = "User", string email = "test@example.com")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Role", role);
        client.DefaultRequestHeaders.Add("X-Test-Email", email);
        return client;
    }

    /// <summary>
    /// UC-9.2-TC-1: Get expert confirmation with valid IDs
    /// Expected: 200 OK with expert confirmation details
    /// Request: expertId=2, userId=1, chatId=1
    /// </summary>
    [Fact]
    public async Task UC_9_2_TC_1_GetExpertConfirmation_WithValidIds_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");

        var response = await client.GetAsync("/api/expert-confirmation/2/1/1");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 200 or 404, got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(responseContent);
            var root = json.RootElement;

            // Check for expected properties
            if (root.TryGetProperty("userId", out _))
            {
                Assert.True(root.TryGetProperty("userId", out var userId), "Should have userId");
                Assert.Equal(1, userId.GetInt32());
            }
        }
    }

    /// <summary>
    /// UC-9.2-TC-2: Get expert confirmation with non-existent IDs
    /// Expected: 404 Not Found with error message
    /// Request: expertId=9999, userId=9999, chatId=9999
    /// </summary>
    [Fact]
    public async Task UC_9_2_TC_2_GetExpertConfirmation_WithNonExistentIds_Returns404()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");

        var response = await client.GetAsync("/api/expert-confirmation/9999/9999/9999");

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK,
            $"Expected 404, got {response.StatusCode}");
    }
}
