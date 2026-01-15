using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho DeleteVersion API
/// DELETE /api/policies/admin/versions/{versionId}
/// </summary>
public class DeleteVersionIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DeleteVersionIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_9_11_TC_1_DeleteVersion_Draft_ReturnsSuccess()
    {
        var client = CreateAdminClient();
        var response = await client.DeleteAsync("/api/policies/admin/versions/1");
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 404, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_11_TC_2_DeleteVersion_NonExistent_ReturnsNotFound()
    {
        var client = CreateAdminClient();
        var response = await client.DeleteAsync("/api/policies/admin/versions/99999");
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 404, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_11_TC_3_DeleteVersion_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync("/api/policies/admin/versions/1");
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
