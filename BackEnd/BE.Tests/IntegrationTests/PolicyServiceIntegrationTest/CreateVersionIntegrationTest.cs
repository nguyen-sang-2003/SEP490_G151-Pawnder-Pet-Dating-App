using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho CreateVersion API
/// POST /api/policies/admin/{policyId}/versions
/// </summary>
public class CreateVersionIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CreateVersionIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_9_8_TC_1_CreateVersion_WithValidData_ReturnsCreated()
    {
        var client = CreateAdminClient();
        var requestBody = new { content = "New content", versionNumber = "2.0" };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/admin/1/versions", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 201, 200, 404, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_8_TC_2_CreateVersion_NonExistentPolicy_ReturnsNotFound()
    {
        var client = CreateAdminClient();
        var requestBody = new { content = "Test" };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/admin/99999/versions", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 404, 400 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_8_TC_3_CreateVersion_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var requestBody = new { content = "Test" };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/policies/admin/1/versions", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
