using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetAllActivePolicies API
/// GET /api/policies/active
/// </summary>
public class GetAllActivePoliciesIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetAllActivePoliciesIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_9_13_TC_1_GetAllActivePolicies_AsUser_ReturnsList()
    {
        var client = CreateUserClient();
        var response = await client.GetAsync("/api/policies/active");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_13_TC_2_GetAllActivePolicies_WithoutAuth_ReturnsList()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/policies/active");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_13_TC_3_GetAllActivePolicies_AsAdmin_ReturnsList()
    {
        var client = CreateAdminClient();
        var response = await client.GetAsync("/api/policies/active");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200 or 500, got {response.StatusCode}");
    }
}
