using BE.DTO;
using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;

namespace BE.Tests.Services.PetImageAnalysisServiceTest
{
    public class AnalyzeImageAsyncTest : IDisposable
    {
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly HttpClient _httpClient;
        private readonly PawnderDatabaseContext _context;
        private readonly PetImageAnalysisService _petImageAnalysisService;

        public AnalyzeImageAsyncTest()
        {
            // Create real InMemory DbContext
            var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
                .UseInMemoryDatabase(databaseName: "TestDatabase_" + Guid.NewGuid().ToString())
                .Options;

            _context = new PawnderDatabaseContext(options);

            // Setup mock Configuration
            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfiguration.Setup(c => c["GeminiAI:ApiKey"]).Returns("test-api-key");

            // Setup mock HttpMessageHandler
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_mockHttpMessageHandler.Object);

            // Khởi tạo service
            _petImageAnalysisService = new PetImageAnalysisService(
                _context,
                _mockConfiguration.Object,
                _httpClient
            );
        }

        public void Dispose()
        {
            _context?.Dispose();
            _httpClient?.Dispose();
        }

        private Mock<IFormFile> CreateMockFormFile(string fileName, long length = 1024, string contentType = "image/jpeg")
        {
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns(fileName);
            mockFile.Setup(f => f.ContentType).Returns(contentType);
            mockFile.Setup(f => f.Length).Returns(length);
            
            var content = new byte[length > 0 ? length : 0];
            var stream = new MemoryStream(content);
            mockFile.Setup(f => f.OpenReadStream()).Returns(stream);
            mockFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                .Callback<Stream, CancellationToken>((s, ct) => stream.CopyTo(s))
                .Returns(Task.CompletedTask);

            return mockFile;
        }

        #region UTCID Tests

        /// <summary>
        /// UTCID01: Normal case - Valid IFormFile, Attributes available, Gemini API returns valid JSON, valid ContentType
        /// Condition: IFormFile valid (not null, Length > 0), Attributes available, Gemini API returns valid JSON, Image ContentType valid, API Key valid
        /// Expected: Return PetImageAnalysisResponse (not null), Message = "Phân tích ảnh thành công"
        /// </summary>
        [Fact]
        public async Task UTCID01_AnalyzeImageAsync_ValidImageAndApiReturnsValidJson_ReturnsSuccessResponse()
        {
            // Arrange
            var attribute = new BE.Models.Attribute
            {
                AttributeId = 1,
                Name = "Giống",
                TypeValue = "option",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            var attributeOption = new AttributeOption
            {
                OptionId = 1,
                AttributeId = 1,
                Name = "Mèo Ba Tư",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            attribute.AttributeOptions = new List<AttributeOption> { attributeOption };
            _context.Attributes.Add(attribute);
            await _context.SaveChangesAsync();

            var mockFile = CreateMockFormFile("cat.jpg", 1024, "image/jpeg");

            // Setup Gemini API response
            var geminiResponse = new
            {
                candidates = new[]
                {
                    new
                    {
                        content = new
                        {
                            parts = new[]
                            {
                                new { text = "{\"isCat\":true,\"attributes\":[{\"attributeName\":\"Giống\",\"optionName\":\"Mèo Ba Tư\"}]}" }
                            }
                        }
                    }
                }
            };

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(JsonSerializer.Serialize(geminiResponse), Encoding.UTF8, "application/json")
                });

            // Act
            var result = await _petImageAnalysisService.AnalyzeImageAsync(mockFile.Object);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Success);
            Assert.Equal("Phân tích ảnh thành công", result.Message);
            Assert.NotNull(result.Attributes);
        }

        /// <summary>
        /// UTCID02: Abnormal case - IFormFile is null
        /// Condition: IFormFile is null
        /// Expected: Return PetImageAnalysisResponse (not null), Message = "Không có ảnh được tải lên"
        /// </summary>
        [Fact]
        public async Task UTCID02_AnalyzeImageAsync_NullImage_ReturnsNoImageMessage()
        {
            // Arrange
            IFormFile? nullImage = null;

            // Act
            var result = await _petImageAnalysisService.AnalyzeImageAsync(nullImage!);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.Success);
            Assert.Equal("Không có ảnh được tải lên", result.Message);
        }

        /// <summary>
        /// UTCID03: Abnormal case - Valid IFormFile but Gemini API returns null/empty
        /// Condition: IFormFile valid, Attributes available, Gemini API returns null/empty, API Key valid
        /// Expected: Return PetImageAnalysisResponse (not null), Message = "Lỗi khi phân tích ảnh: ..."
        /// </summary>
        [Fact]
        public async Task UTCID03_AnalyzeImageAsync_GeminiApiReturnsEmpty_ReturnsErrorMessage()
        {
            // Arrange
            var attribute = new BE.Models.Attribute
            {
                AttributeId = 1,
                Name = "Giống",
                TypeValue = "option",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Attributes.Add(attribute);
            await _context.SaveChangesAsync();

            var mockFile = CreateMockFormFile("cat.jpg", 1024, "image/jpeg");

            // Setup Gemini API response with no candidates
            var geminiResponse = new
            {
                candidates = Array.Empty<object>()
            };

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(JsonSerializer.Serialize(geminiResponse), Encoding.UTF8, "application/json")
                });

            // Act
            var result = await _petImageAnalysisService.AnalyzeImageAsync(mockFile.Object);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.Success);
            Assert.Contains("Lỗi khi phân tích ảnh", result.Message);
        }

        /// <summary>
        /// UTCID04: Normal case - Valid IFormFile, Attributes available, valid configuration
        /// Condition: IFormFile valid (not null, Length > 0), Attributes available, API Key Configuration valid
        /// Expected: Return PetImageAnalysisResponse (not null)
        /// </summary>
        [Fact]
        public async Task UTCID04_AnalyzeImageAsync_ValidImageWithAttributes_ReturnsResponse()
        {
            // Arrange
            var attribute1 = new BE.Models.Attribute
            {
                AttributeId = 1,
                Name = "Cân nặng",
                TypeValue = "float",
                Unit = "kg",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            var attribute2 = new BE.Models.Attribute
            {
                AttributeId = 2,
                Name = "Tuổi",
                TypeValue = "int",
                Unit = "tháng",
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            _context.Attributes.AddRange(attribute1, attribute2);
            await _context.SaveChangesAsync();

            var mockFile = CreateMockFormFile("cat.jpg", 2048, "image/png");

            // Setup Gemini API response
            var geminiResponse = new
            {
                candidates = new[]
                {
                    new
                    {
                        content = new
                        {
                            parts = new[]
                            {
                                new { text = "{\"isCat\":true,\"attributes\":[{\"attributeName\":\"Cân nặng\",\"value\":5},{\"attributeName\":\"Tuổi\",\"value\":12}]}" }
                            }
                        }
                    }
                }
            };

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(JsonSerializer.Serialize(geminiResponse), Encoding.UTF8, "application/json")
                });

            // Act
            var result = await _petImageAnalysisService.AnalyzeImageAsync(mockFile.Object);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Success);
            Assert.NotNull(result.Attributes);
            Assert.Equal(2, result.Attributes.Count);
        }

        #endregion
    }
}
