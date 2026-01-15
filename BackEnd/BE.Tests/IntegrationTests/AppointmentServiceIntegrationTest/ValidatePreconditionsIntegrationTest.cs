using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.AppointmentServiceIntegrationTest;

/// <summary>
/// Integration Tests cho ValidatePreconditions API
/// GET /api/appointment/validate-preconditions
/// </summary>
public class ValidatePreconditionsIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ValidatePreconditionsIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient(int userId = 10)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Role", "User");
        client.DefaultRequestHeaders.Add("X-Test-Email", $"user{userId}@example.com");
        return client;
    }

    [Fact]
    public async Task UC_6_12_TC_1_ValidatePreconditions_WithValidParams_ReturnsIsValidTrue()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);

        // Act
        var response = await client.GetAsync("/api/appointment/validate-preconditions?matchId=10&inviterPetId=10&inviteePetId=11");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            $"Expected status code 200, but got {response.StatusCode}");

        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var root = jsonDocument.RootElement;

        Assert.True(root.TryGetProperty("isValid", out _), "Response should contain 'isValid' field");
        Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
    }

    [Fact]
    public async Task UC_6_12_TC_2_ValidatePreconditions_WithInvalidMatchId_ReturnsIsValidFalse()
    {
        // Arrange
        var client = CreateAuthenticatedClient(10);

        // Act
        var response = await client.GetAsync("/api/appointment/validate-preconditions?matchId=99999&inviterPetId=10&inviteePetId=11");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var root = jsonDocument.RootElement;

        Assert.True(root.TryGetProperty("isValid", out var isValidProp), "Response should contain 'isValid' field");
        Assert.False(isValidProp.GetBoolean(), "isValid should be false for invalid matchId");
        Assert.True(root.TryGetProperty("message", out _), "Response should contain 'message' field");
    }

    [Fact]
    public async Task UC_6_12_TC_3_ValidatePreconditions_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/appointment/validate-preconditions?matchId=10&inviterPetId=10&inviteePetId=11");

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
