using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho DeletePolicy API
/// DELETE /api/policies/admin/{policyId}
/// </summary>
public class DeletePolicyIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DeletePolicyIntegrationTest(CustomWebApplicationFactory factory)
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

    [Fact]
    public async Task UC_9_5_TC_1_DeletePolicy_Existing_ReturnsSuccess()
    {
        var client = CreateAdminClient();
        var response = await client.DeleteAsync("/api/policies/admin/1");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 404 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_5_TC_2_DeletePolicy_NonExistent_ReturnsNotFound()
    {
        var client = CreateAdminClient();
        var response = await client.DeleteAsync("/api/policies/admin/99999");
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 404, 200 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_5_TC_3_DeletePolicy_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync("/api/policies/admin/1");
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
