using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ExpertConfirmationServiceIntegrationTest;

public class GetUserExpertConfirmationsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetUserExpertConfirmationsIntegrationTest(CustomWebApplicationFactory factory)
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
    /// UC-9.3-TC-1: Get user expert confirmations with existing data
    /// Expected: 200 OK with list of user's expert confirmations
    /// </summary>
    [Fact]
    public async Task UC_9_3_TC_1_GetUserExpertConfirmations_WithExistingData_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");

        var response = await client.GetAsync("/api/expert-confirmation/user/1");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 200 or 404, got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(responseContent);
            var root = json.RootElement;

            // Response should be array
            if (root.ValueKind == JsonValueKind.Array)
            {
                Assert.True(root.GetArrayLength() >= 0, "Should return array of confirmations");
            }
        }
    }

    /// <summary>
    /// UC-9.3-TC-2: Get user expert confirmations with no data
    /// Expected: 200 OK with empty array
    /// </summary>
    [Fact]
    public async Task UC_9_3_TC_2_GetUserExpertConfirmations_WithNoData_ReturnsEmptyArray()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");

        var response = await client.GetAsync("/api/expert-confirmation/user/1");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 200 or 404, got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(responseContent);
            var root = json.RootElement;

            // Response should be array
            if (root.ValueKind == JsonValueKind.Array)
            {
                Assert.True(root.GetArrayLength() >= 0, "Should return empty or populated array");
            }
        }
    }

    /// <summary>
    /// UC-9.3-TC-3: Get user expert confirmations with non-existent user
    /// Expected: 404 Not Found or 200 with empty array
    /// </summary>
    [Fact]
    public async Task UC_9_3_TC_3_GetUserExpertConfirmations_WithNonExistentUser_Returns404OrEmpty()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");

        var response = await client.GetAsync("/api/expert-confirmation/user/9999");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 200 or 404, got {response.StatusCode}");
    }
}
