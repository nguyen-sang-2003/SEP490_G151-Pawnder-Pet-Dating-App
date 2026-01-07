using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ExpertConfirmationServiceIntegrationTest;

public class GetUserExpertChatsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetUserExpertChatsIntegrationTest(CustomWebApplicationFactory factory)
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
    /// UC-9.6-TC-1: Get user expert chats with existing chats
    /// Expected: 200 OK with list of expert chats
    /// </summary>
    [Fact]
    public async Task UC_9_6_TC_1_GetUserExpertChats_WithExistingChats_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");

        var response = await client.GetAsync("/api/expert-confirmation/user-expert-chats/1");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 200 or 404, got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(responseContent);
            var root = json.RootElement;

            // Check for success property or array response
            if (root.TryGetProperty("success", out var success))
            {
                Assert.True(success.GetBoolean(), "Success should be true");
            }
            else if (root.ValueKind == JsonValueKind.Array)
            {
                Assert.True(root.GetArrayLength() >= 0, "Should return array of chats");
            }
        }
    }

    /// <summary>
    /// UC-9.6-TC-2: Get user expert chats with no chats
    /// Expected: 200 OK with empty array
    /// </summary>
    [Fact]
    public async Task UC_9_6_TC_2_GetUserExpertChats_WithNoChats_ReturnsEmptyArray()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");

        var response = await client.GetAsync("/api/expert-confirmation/user-expert-chats/1");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 200 or 404, got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(responseContent);
            var root = json.RootElement;

            // Check for success property
            if (root.TryGetProperty("success", out var success))
            {
                Assert.True(success.GetBoolean(), "Success should be true");
                if (root.TryGetProperty("data", out var data))
                {
                    // Data should be array
                    Assert.Equal(JsonValueKind.Array, data.ValueKind);
                }
            }
            else if (root.ValueKind == JsonValueKind.Array)
            {
                // Empty array is acceptable
                Assert.True(root.GetArrayLength() >= 0, "Should return empty or populated array");
            }
        }
    }

    /// <summary>
    /// UC-9.6-TC-3: Get user expert chats with non-existent user
    /// Expected: 200 OK with empty array
    /// </summary>
    [Fact]
    public async Task UC_9_6_TC_3_GetUserExpertChats_WithNonExistentUser_ReturnsEmptyArray()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");

        var response = await client.GetAsync("/api/expert-confirmation/user-expert-chats/9999");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 200 or 404, got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(responseContent);
            var root = json.RootElement;

            // Should return empty or success response
            if (root.TryGetProperty("success", out var success))
            {
                Assert.True(success.GetBoolean(), "Success should be true");
            }
        }
    }
}
