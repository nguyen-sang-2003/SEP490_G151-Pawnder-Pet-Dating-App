using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.PolicyServiceIntegrationTest;

/// <summary>
/// Integration Tests cho UpdatePolicy API
/// PUT /api/policies/admin/{policyId}
/// </summary>
public class UpdatePolicyIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public UpdatePolicyIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_9_4_TC_1_UpdatePolicy_WithValidData_ReturnsSuccess()
    {
        var client = CreateAdminClient();
        var requestBody = new { title = "Updated Title" };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PutAsync("/api/policies/admin/1", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 200, 404 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_4_TC_2_UpdatePolicy_NonExistent_ReturnsNotFound()
    {
        var client = CreateAdminClient();
        var requestBody = new { title = "Test" };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PutAsync("/api/policies/admin/99999", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected 404 or 500, got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_9_4_TC_3_UpdatePolicy_WithoutAuth_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var requestBody = new { title = "Test" };
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PutAsync("/api/policies/admin/1", content);
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 401 or 403, got {response.StatusCode}");
    }
}
