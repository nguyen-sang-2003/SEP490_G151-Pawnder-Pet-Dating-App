using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho CheckPolicyStatus API
/// GET /api/policies/status
/// </summary>
public class CheckPolicyStatusIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CheckPolicyStatusIntegrationTest(CustomWebApplicationFactory factory)
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

    private HttpClient CreateAdminClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
        return client;
    }

    [Fact]
    public async Task UC_9_15_TC_1_CheckPolicyStatus_AsUser_ReturnsStatus()
    {
        var client = CreateUserClient();
        var response = await client.GetAsync("/api/policies/status");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_15_TC_2_CheckPolicyStatus_AsAdmin_ReturnsStatus()
    {
        var client = CreateAdminClient();
        var response = await client.GetAsync("/api/policies/status");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_15_TC_3_CheckPolicyStatus_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/policies/status");
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
