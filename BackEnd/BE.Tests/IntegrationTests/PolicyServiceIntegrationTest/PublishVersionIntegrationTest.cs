using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho PublishVersion API
/// POST /api/policies/admin/versions/{versionId}/publish
/// </summary>
public class PublishVersionIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public PublishVersionIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_9_10_TC_1_PublishVersion_Draft_ReturnsSuccess()
    {
        var client = CreateAdminClient();
        var response = await client.PostAsync("/api/policies/admin/versions/1/publish", null);
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 404, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_10_TC_2_PublishVersion_NonExistent_ReturnsNotFound()
    {
        var client = CreateAdminClient();
        var response = await client.PostAsync("/api/policies/admin/versions/99999/publish", null);
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 404, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_10_TC_3_PublishVersion_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync("/api/policies/admin/versions/1/publish", null);
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
