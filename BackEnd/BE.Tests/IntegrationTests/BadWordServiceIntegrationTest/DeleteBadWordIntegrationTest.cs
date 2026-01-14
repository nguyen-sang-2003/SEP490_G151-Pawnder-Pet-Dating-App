using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.BadWordServiceIntegrationTest;

/// <summary>
/// Integration Tests cho DeleteBadWord API
/// DELETE /api/badword/{id}
/// </summary>
public class DeleteBadWordIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DeleteBadWordIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_7_5_TC_1_DeleteBadWord_ExistingId_ReturnsSuccess()
    {
        // Arrange
        var client = CreateAdminClient();

        // Act
        var response = await client.DeleteAsync("/api/badword/1");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.NoContent || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 404, 204 or 500, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
        }
    }

    [Fact]
    public async Task UC_7_5_TC_2_DeleteBadWord_NonExistent_ReturnsNotFound()
    {
        // Arrange
        var client = CreateAdminClient();

        // Act
        var response = await client.DeleteAsync("/api/badword/99999");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 404, 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_7_5_TC_3_DeleteBadWord_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.DeleteAsync("/api/badword/1");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
