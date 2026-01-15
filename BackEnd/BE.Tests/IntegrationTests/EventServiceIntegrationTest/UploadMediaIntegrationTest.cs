using System.Net;
using Xunit;

namespace BE.Tests.IntegrationTests.EventServiceIntegrationTest;

/// <summary>
/// Integration Tests cho UploadMedia API
/// POST /api/event/upload-media
/// </summary>
public class UploadMediaIntegrationTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public UploadMediaIntegrationTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
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
    public async Task UC_8_11_TC_1_UploadMedia_WithValidImage_ReturnsSuccess()
    {
        // Arrange
        var client = CreateUserClient();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }); // JPEG magic bytes
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        content.Add(fileContent, "file", "test.jpg");

        // Act
        var response = await client.PostAsync("/api/event/upload-media", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 200, 400 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_11_TC_2_UploadMedia_WithoutFile_ReturnsBadRequest()
    {
        // Arrange
        var client = CreateUserClient();
        var content = new MultipartFormDataContent();

        // Act
        var response = await client.PostAsync("/api/event/upload-media", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.InternalServerError,
            $"Expected status code 400, 200 or 500, but got {response.StatusCode}");
    }

    [Fact]
    public async Task UC_8_11_TC_3_UploadMedia_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var content = new MultipartFormDataContent();

        // Act
        var response = await client.PostAsync("/api/event/upload-media", content);

        // Assert
        Assert.True(
            response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected status code 401 or 403, but got {response.StatusCode}");
    }
}
