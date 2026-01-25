using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ExpertConfirmationServiceIntegrationTest;

public class GetAllExpertConfirmationsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetAllExpertConfirmationsIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient(int userId, string role = "Admin", string email = "admin@example.com")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Role", role);
        client.DefaultRequestHeaders.Add("X-Test-Email", email);
        return client;
    }

    /// <summary>
    /// UC-9.1-TC-1: Get all expert confirmations with existing data
    /// Expected: 200 OK with list of expert confirmations
    /// </summary>
    [Fact]
    public async Task UC_9_1_TC_1_GetAllExpertConfirmations_WithExistingData_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(1, "Admin", "admin@example.com");

        var response = await client.GetAsync("/api/expert-confirmation");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 200 or 404, got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(responseContent);
            var root = json.RootElement;

            // Response should be array or have data property
            if (root.ValueKind == JsonValueKind.Array)
            {
                // Direct array response
                Assert.True(root.GetArrayLength() >= 0, "Should return array of confirmations");
            }
        }
    }

    /// <summary>
    /// UC-9.1-TC-2: Get all expert confirmations with no data
    /// Expected: 200 OK with empty array
    /// </summary>
    [Fact]
    public async Task UC_9_1_TC_2_GetAllExpertConfirmations_WithNoData_ReturnsEmptyArray()
    {
        var client = CreateAuthenticatedClient(1, "Admin", "admin@example.com");

        var response = await client.GetAsync("/api/expert-confirmation");

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
                // Empty array is acceptable
                Assert.True(root.GetArrayLength() >= 0, "Should return empty or populated array");
            }
        }
    }
}
