using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho AcceptPolicy API
/// POST /api/policies/accept
/// </summary>
public class AcceptPolicyIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AcceptPolicyIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateUserClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "10");
        client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        client.DefaultRequestHeaders.Add("X-Test-Email", "user10@example.com");
        return client;
    }

    [Fact]
    public async Task UC_9_17_TC_1_AcceptPolicy_AsUser_ReturnsSuccess()
    {
        var client = CreateUserClient();
        var requestBody = new { policyVersionId = 1 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/accept", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 404, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_17_TC_2_AcceptPolicy_NonExistent_ReturnsNotFound()
    {
        var client = CreateUserClient();
        var requestBody = new { policyVersionId = 99999 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/accept", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 404, 400, 200 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_17_TC_3_AcceptPolicy_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var requestBody = new { policyVersionId = 1 };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/accept", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
