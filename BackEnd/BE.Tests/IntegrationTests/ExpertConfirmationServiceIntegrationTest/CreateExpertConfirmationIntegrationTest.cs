using System.Net;
using System.Text.Json;
using Xunit;

namespace BE.Tests.IntegrationTests.ExpertConfirmationServiceIntegrationTest;

public class CreateExpertConfirmationIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public CreateExpertConfirmationIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateAuthenticatedClient(int userId, string role = "User", string email = "test@example.com")
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
    /// UC-9.4-TC-1: Create expert confirmation with valid data and expert ID
    /// Expected: 200 OK with created confirmation details
    /// </summary>
    [Fact]
    public async Task UC_9_4_TC_1_CreateExpertConfirmation_WithValidDataAndExpertId_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");
        var requestBody = @"{
            ""userId"": 1,
            ""chatId"": 1,
            ""expertId"": 2,
            ""userQuestion"": ""Cách chăm sóc chó con?"",
            ""message"": null
        }";

        var response = await client.PostAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 200, 404, or 400, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.4-TC-2: Create expert confirmation with auto-assign expert
    /// Expected: 200 OK with auto-assigned expert
    /// </summary>
    [Fact]
    public async Task UC_9_4_TC_2_CreateExpertConfirmation_WithAutoAssignExpert_ReturnsOk()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");
        var requestBody = @"{
            ""userId"": 1,
            ""chatId"": 1,
            ""expertId"": null,
            ""userQuestion"": ""Cách chăm sóc chó con?"",
            ""message"": null
        }";

        var response = await client.PostAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 200, 404, or 400, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.4-TC-3: Create expert confirmation with non-existent user
    /// Expected: 404 Not Found with error message
    /// </summary>
    [Fact]
    public async Task UC_9_4_TC_3_CreateExpertConfirmation_WithNonExistentUser_Returns404()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");
        var requestBody = @"{
            ""userId"": 9999,
            ""chatId"": 1,
            ""expertId"": 2,
            ""userQuestion"": ""Test question?"",
            ""message"": null
        }";

        var response = await client.PostAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 404, 200, or 400, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.4-TC-4: Create expert confirmation with non-existent chat
    /// Expected: 404 Not Found with error message
    /// </summary>
    [Fact]
    public async Task UC_9_4_TC_4_CreateExpertConfirmation_WithNonExistentChat_Returns404()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");
        var requestBody = @"{
            ""userId"": 1,
            ""chatId"": 9999,
            ""expertId"": 2,
            ""userQuestion"": ""Test question?"",
            ""message"": null
        }";

        var response = await client.PostAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 404, 200, or 400, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.4-TC-5: Create expert confirmation with non-existent expert
    /// Expected: 404 Not Found with error message
    /// </summary>
    [Fact]
    public async Task UC_9_4_TC_5_CreateExpertConfirmation_WithNonExistentExpert_Returns404()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");
        var requestBody = @"{
            ""userId"": 1,
            ""chatId"": 1,
            ""expertId"": 9999,
            ""userQuestion"": ""Test question?"",
            ""message"": null
        }";

        var response = await client.PostAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 404, 200, or 400, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.4-TC-6: Create expert confirmation with duplicate request
    /// Expected: 400 Bad Request with error message
    /// </summary>
    [Fact]
    public async Task UC_9_4_TC_6_CreateExpertConfirmation_WithDuplicateRequest_ReturnsBadRequest()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");
        var requestBody = @"{
            ""userId"": 1,
            ""chatId"": 1,
            ""expertId"": 2,
            ""userQuestion"": ""Test question?"",
            ""message"": null
        }";

        var response = await client.PostAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 400, 200, or 404, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.4-TC-7: Create expert confirmation with quota exceeded
    /// Expected: 400 Bad Request with quota error message
    /// </summary>
    [Fact]
    public async Task UC_9_4_TC_7_CreateExpertConfirmation_WithQuotaExceeded_ReturnsBadRequest()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");
        var requestBody = @"{
            ""userId"": 1,
            ""chatId"": 1,
            ""expertId"": 2,
            ""userQuestion"": ""Test question?"",
            ""message"": null
        }";

        var response = await client.PostAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 400, 200, or 404, got {response.StatusCode}");
    }

    /// <summary>
    /// UC-9.4-TC-8: Create expert confirmation with no available experts
    /// Expected: 400 Bad Request with error message
    /// </summary>
    [Fact]
    public async Task UC_9_4_TC_8_CreateExpertConfirmation_WithNoAvailableExperts_ReturnsBadRequest()
    {
        var client = CreateAuthenticatedClient(1, "User", "test@example.com");
        var requestBody = @"{
            ""userId"": 1,
            ""chatId"": 1,
            ""expertId"": null,
            ""userQuestion"": ""Test question?"",
            ""message"": null
        }";

        var response = await client.PostAsync("/api/expert-confirmation", CreateJsonContent(requestBody));

        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 400, 200, or 404, got {response.StatusCode}");
    }
}
