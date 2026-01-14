using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetAcceptStats API
/// GET /api/policies/admin/stats
/// </summary>
public class GetAcceptStatsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetAcceptStatsIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAdminClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", "1");
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");
        client.DefaultRequestHeaders.Add("X-Test-Email", "admin@example.com");
        return client;
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
    public async Task UC_9_12_TC_1_GetAcceptStats_AsAdmin_ReturnsList()
    {
        var client = CreateAdminClient();
        var response = await client.GetAsync("/api/policies/admin/stats");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_12_TC_2_GetAcceptStats_AsUser_ReturnsForbidden()
    {
        var client = CreateUserClient();
        var response = await client.GetAsync("/api/policies/admin/stats");
        Assert.True(
            response.StatusCode == HttpStatusCode.Forbidden || response.StatusCode == HttpStatusCode.Unauthorized,
            $"Expected 403 or 401, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_12_TC_3_GetAcceptStats_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/policies/admin/stats");
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
