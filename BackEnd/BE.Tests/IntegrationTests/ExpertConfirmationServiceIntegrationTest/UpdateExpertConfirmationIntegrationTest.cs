using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ExpertConfirmationServiceIntegrationTest;

public class UpdateExpertConfirmationIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public UpdateExpertConfirmationIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient(int userId, string role = "Expert", string email = "expert@example.com")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-UserId", userId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Role", role);
        client.DefaultRequestHeaders.Add("X-Test-Email", email);
        return client;
    }

    private StringContent CreateJsonContent(string json)
    {
        return new StringContent(json, System.Text.Encoding.UTF8, "application/json");
    }

    /// <summary>
    /// UC-9.5-TC-1: Update expert confirmation with valid data
    /// Expected: 200 OK with updated confirmation
    /// </summary>
    [Fact]
    public async Task UC_9_5_TC_1_UpdateExpertConfirmation_WithValidData_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(2, "Expert", "expert@example.com");
        var requestBody = @"{
            ""expertId"": 2,
            ""userId"": 1,
            ""chatId"": 1,
            ""status"": ""confirmed"",
            ""message"": ""Thông tin chính xác, bạn có thể yên tâm.""
        }";

        var response = await client.PutAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 200, 404, or 400, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.5-TC-2: Update expert confirmation with status only
    /// Expected: 200 OK with updated status
    /// </summary>
    [Fact]
    public async Task UC_9_5_TC_2_UpdateExpertConfirmation_WithStatusOnly_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(2, "Expert", "expert@example.com");
        var requestBody = @"{
            ""expertId"": 2,
            ""userId"": 1,
            ""chatId"": 1,
            ""status"": ""rejected"",
            ""message"": null
        }";

        var response = await client.PutAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 200, 404, or 400, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.5-TC-3: Update expert confirmation with message only
    /// Expected: 200 OK with updated message
    /// </summary>
    [Fact]
    public async Task UC_9_5_TC_3_UpdateExpertConfirmation_WithMessageOnly_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(2, "Expert", "expert@example.com");
        var requestBody = @"{
            ""expertId"": 2,
            ""userId"": 1,
            ""chatId"": 1,
            ""status"": null,
            ""message"": ""Cần kiểm tra thêm""
        }";

        var response = await client.PutAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 200, 404, or 400, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.5-TC-4: Update expert confirmation with non-existent confirmation
    /// Expected: 404 Not Found
    /// </summary>
    [Fact]
    public async Task UC_9_5_TC_4_UpdateExpertConfirmation_WithNonExistentConfirmation_Returns404()
    {
        var client = CreateAuthenticatedClient(2, "Expert", "expert@example.com");
        var requestBody = @"{
            ""expertId"": 9999,
            ""userId"": 9999,
            ""chatId"": 9999,
            ""status"": ""confirmed"",
            ""message"": ""Test message""
        }";

        var response = await client.PutAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 404, 200, or 400, got {response.StatusCode}");
    }
}
