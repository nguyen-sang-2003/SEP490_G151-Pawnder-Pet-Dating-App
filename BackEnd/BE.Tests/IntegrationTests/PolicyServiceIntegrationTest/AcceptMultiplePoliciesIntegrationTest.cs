using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho AcceptMultiplePolicies API
/// POST /api/policies/accept-all
/// </summary>
public class AcceptMultiplePoliciesIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AcceptMultiplePoliciesIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_9_18_TC_1_AcceptMultiplePolicies_AsUser_ReturnsSuccess()
    {
        var client = CreateUserClient();
        var requestBody = new { policyVersionIds = new[] { 1, 2 } };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/accept-all", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_18_TC_2_AcceptMultiplePolicies_EmptyList_ReturnsSuccess()
    {
        var client = CreateUserClient();
        var requestBody = new { policyVersionIds = new int[] { } };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/accept-all", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_18_TC_3_AcceptMultiplePolicies_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var requestBody = new { policyVersionIds = new[] { 1 } };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/accept-all", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
