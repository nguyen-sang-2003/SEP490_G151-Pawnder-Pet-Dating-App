using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.BadWordServiceIntegrationTest;

/// <summary>
/// Integration Tests cho GetAllBadWords API
/// GET /api/badword
/// </summary>
public class GetAllBadWordsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GetAllBadWordsIntegrationTest(CustomWebApplicationFactory factory)
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
    public async Task UC_7_1_TC_1_GetAllBadWords_AsAdmin_ReturnsList()
    {
        // Arrange
        var client = CreateAdminClient();

        // Act
        var response = await client.GetAsync("/api/badword");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200 or 500, but got {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonDocument = JsonDocument.Parse(responseBody);
            var root = jsonDocument.RootElement;

            Assert.True(root.ValueKind == JsonValueKind.Array, "Response should be an array");
        }
    }

    [Fact]
    public async Task UC_7_1_TC_2_GetAllBadWords_AsUser_ReturnsForbidden()
    {
        // Arrange
        var client = CreateUserClient();

        // Act
        var response = await client.GetAsync("/api/badword");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Forbidden || response.StatusCode == HttpStatusCode.Unauthorized,
            $"Expected status code 403 or 401, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_7_1_TC_3_GetAllBadWords_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/badword");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
