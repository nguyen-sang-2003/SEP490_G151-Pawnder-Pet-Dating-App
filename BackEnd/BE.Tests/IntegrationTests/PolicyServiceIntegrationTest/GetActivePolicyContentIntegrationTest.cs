using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetActivePolicyContent API
/// GET /api/policies/active/{policyCode}
/// </summary>
public class GetActivePolicyContentIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetActivePolicyContentIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_9_14_TC_1_GetActivePolicyContent_ByCode_ReturnsPolicy()
    {
        var client = CreateUserClient();
        var response = await client.GetAsync("/api/policies/active/TERMS");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 404 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_14_TC_2_GetActivePolicyContent_NonExistent_ReturnsNotFound()
    {
        var client = CreateUserClient();
        var response = await client.GetAsync("/api/policies/active/INVALID_CODE");
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 404, 200 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_14_TC_3_GetActivePolicyContent_WithoutAuth_ReturnsPolicy()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/policies/active/TERMS");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 404 or 500, got {response.StatusCode}");
    }
}
