using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services;
using Moq;
using System.Dynamic;
using System.Text.Json;
using Xunit;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Tests.Services.AttributeServiceTest;

public class GetAttributesForFilterAsyncTest
{
    private readonly Mock<IAttributeRepository> _mockAttributeRepository;
    private readonly AttributeService _attributeService;

    public GetAttributesForFilterAsyncTest()
    {
        _mockAttributeRepository = new Mock<IAttributeRepository>();
        _attributeService = new AttributeService(_mockAttributeRepository.Object);
    }

    [Fact(DisplayName = "UTCID01: GetAttributesForFilterAsync with attributes exist, Percent > 0, count >= 2 and <= 3 - Return success response")]
    public async Task GetAttributesForFilterAsync_WithAttributesAndPercentGreaterThanZero_ReturnsSuccess()
    {
        // Arrange
        dynamic attr1 = new ExpandoObject();
        attr1.AttributeId = 1;
        attr1.Name = "Color";
        attr1.Percent = 40m;
        attr1.TypeValue = null;
        attr1.Unit = null;
        attr1.Options = new List<object>();

        dynamic attr2 = new ExpandoObject();
        attr2.AttributeId = 2;
        attr2.Name = "Size";
        attr2.Percent = 35m;
        attr2.TypeValue = null;
        attr2.Unit = null;
        attr2.Options = new List<object>();

        dynamic attr3 = new ExpandoObject();
        attr3.AttributeId = 3;
        attr3.Name = "Age";
        attr3.Percent = 10m;
        attr3.TypeValue = null;
        attr3.Unit = null;
        attr3.Options = new List<object>();

        dynamic attr4 = new ExpandoObject();
        attr4.AttributeId = 4;
        attr4.Name = "Weight";
        attr4.Percent = 0m;
        attr4.TypeValue = null;
        attr4.Unit = null;
        attr4.Options = new List<object>();

        var attributes = new List<object> { attr1, attr2, attr3, attr4 };

        _mockAttributeRepository
            .Setup(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributes);

        // Act
        var resultObj = await _attributeService.GetAttributesForFilterAsync(CancellationToken.None);
        var json = JsonSerializer.Serialize(resultObj);
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Lấy danh sách thuộc tính để filter thành công.", result.GetProperty("message").GetString());
        var data = result.GetProperty("data");
        Assert.NotNull(data);
        Assert.True(data.GetArrayLength() > 0);
        var suggestion = result.GetProperty("suggestion");
        Assert.NotNull(suggestion);
        var topAttributes = suggestion.GetProperty("topAttributes");
        Assert.NotNull(topAttributes);
        var topAttributesCount = topAttributes.GetArrayLength();
        Assert.True(topAttributesCount >= 2 && topAttributesCount <= 3);
        var totalPercent = suggestion.GetProperty("totalPercent").GetDecimal();
        Assert.True(totalPercent > 0);
        Assert.True(totalPercent == Math.Round(totalPercent, 1));
        _mockAttributeRepository.Verify(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID02: GetAttributesForFilterAsync with attributes empty (not exists) - Return empty data and empty suggestion")]
    public async Task GetAttributesForFilterAsync_WithEmptyAttributes_ReturnsEmptyResponse()
    {
        // Arrange
        var attributes = new List<object>();

        _mockAttributeRepository
            .Setup(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributes);

        // Act
        var resultObj = await _attributeService.GetAttributesForFilterAsync(CancellationToken.None);
        var json = JsonSerializer.Serialize(resultObj);
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Lấy danh sách thuộc tính để filter thành công.", result.GetProperty("message").GetString());
        var data = result.GetProperty("data");
        Assert.NotNull(data);
        Assert.Equal(0, data.GetArrayLength());
        var suggestion = result.GetProperty("suggestion");
        Assert.NotNull(suggestion);
        var topAttributes = suggestion.GetProperty("topAttributes");
        Assert.NotNull(topAttributes);
        Assert.Equal(0, topAttributes.GetArrayLength());
        var totalPercent = suggestion.GetProperty("totalPercent").GetDecimal();
        Assert.Equal(0, totalPercent);
        Assert.True(totalPercent == Math.Round(totalPercent, 1));
        Assert.True(suggestion.TryGetProperty("message", out var messageProp) && messageProp.ValueKind == JsonValueKind.Null);
        _mockAttributeRepository.Verify(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID03: GetAttributesForFilterAsync with attributes exist, Percent not exists (all 0), count > 3 - Return success response with empty suggestion")]
    public async Task GetAttributesForFilterAsync_WithAttributesNoPercent_ReturnsSuccessWithEmptySuggestion()
    {
        // Arrange
        dynamic attr1 = new ExpandoObject();
        attr1.AttributeId = 1;
        attr1.Name = "Color";
        attr1.Percent = 0m;
        attr1.TypeValue = null;
        attr1.Unit = null;
        attr1.Options = new List<object>();

        dynamic attr2 = new ExpandoObject();
        attr2.AttributeId = 2;
        attr2.Name = "Size";
        attr2.Percent = 0m;
        attr2.TypeValue = null;
        attr2.Unit = null;
        attr2.Options = new List<object>();

        dynamic attr3 = new ExpandoObject();
        attr3.AttributeId = 3;
        attr3.Name = "Age";
        attr3.Percent = 0m;
        attr3.TypeValue = null;
        attr3.Unit = null;
        attr3.Options = new List<object>();

        dynamic attr4 = new ExpandoObject();
        attr4.AttributeId = 4;
        attr4.Name = "Weight";
        attr4.Percent = 0m;
        attr4.TypeValue = null;
        attr4.Unit = null;
        attr4.Options = new List<object>();

        var attributes = new List<object> { attr1, attr2, attr3, attr4 };

        _mockAttributeRepository
            .Setup(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributes);

        // Act
        var resultObj = await _attributeService.GetAttributesForFilterAsync(CancellationToken.None);
        var json = JsonSerializer.Serialize(resultObj);
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Lấy danh sách thuộc tính để filter thành công.", result.GetProperty("message").GetString());
        var data = result.GetProperty("data");
        Assert.NotNull(data);
        Assert.True(data.GetArrayLength() > 0);
        var suggestion = result.GetProperty("suggestion");
        Assert.NotNull(suggestion);
        var topAttributes = suggestion.GetProperty("topAttributes");
        Assert.NotNull(topAttributes);
        Assert.Equal(0, topAttributes.GetArrayLength());
        var totalPercent = suggestion.GetProperty("totalPercent").GetDecimal();
        Assert.Equal(0, totalPercent);
        Assert.True(totalPercent == Math.Round(totalPercent, 1));
        Assert.True(suggestion.TryGetProperty("message", out var messageProp) && messageProp.ValueKind == JsonValueKind.Null);
        _mockAttributeRepository.Verify(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID04: GetAttributesForFilterAsync with attributes exist, Percent > 0, count = 1 - Return success response with single suggestion")]
    public async Task GetAttributesForFilterAsync_WithAttributesAndSinglePercent_ReturnsSuccessWithSingleSuggestion()
    {
        // Arrange
        dynamic attr1 = new ExpandoObject();
        attr1.AttributeId = 1;
        attr1.Name = "Color";
        attr1.Percent = 100m;
        attr1.TypeValue = null;
        attr1.Unit = null;
        attr1.Options = new List<object>();

        dynamic attr2 = new ExpandoObject();
        attr2.AttributeId = 2;
        attr2.Name = "Size";
        attr2.Percent = 0m;
        attr2.TypeValue = null;
        attr2.Unit = null;
        attr2.Options = new List<object>();

        var attributes = new List<object> { attr1, attr2 };

        _mockAttributeRepository
            .Setup(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributes);

        // Act
        var resultObj = await _attributeService.GetAttributesForFilterAsync(CancellationToken.None);
        var json = JsonSerializer.Serialize(resultObj);
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Lấy danh sách thuộc tính để filter thành công.", result.GetProperty("message").GetString());
        var data = result.GetProperty("data");
        Assert.NotNull(data);
        Assert.True(data.GetArrayLength() > 0);
        var suggestion = result.GetProperty("suggestion");
        Assert.NotNull(suggestion);
        var topAttributes = suggestion.GetProperty("topAttributes");
        Assert.NotNull(topAttributes);
        Assert.Equal(1, topAttributes.GetArrayLength());
        var totalPercent = suggestion.GetProperty("totalPercent").GetDecimal();
        Assert.True(totalPercent > 0);
        Assert.True(totalPercent == Math.Round(totalPercent, 1));
        Assert.True(suggestion.TryGetProperty("message", out var messageProp) && messageProp.ValueKind != JsonValueKind.Null);
        _mockAttributeRepository.Verify(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "UTCID05: GetAttributesForFilterAsync with attributes exist, Percent > 0, count = 3 - Return success response with 3 suggestions")]
    public async Task GetAttributesForFilterAsync_WithAttributesAndThreePercents_ReturnsSuccessWithThreeSuggestions()
    {
        // Arrange
        dynamic attr1 = new ExpandoObject();
        attr1.AttributeId = 1;
        attr1.Name = "Color";
        attr1.Percent = 50m;
        attr1.TypeValue = null;
        attr1.Unit = null;
        attr1.Options = new List<object>();

        dynamic attr2 = new ExpandoObject();
        attr2.AttributeId = 2;
        attr2.Name = "Size";
        attr2.Percent = 30m;
        attr2.TypeValue = null;
        attr2.Unit = null;
        attr2.Options = new List<object>();

        dynamic attr3 = new ExpandoObject();
        attr3.AttributeId = 3;
        attr3.Name = "Age";
        attr3.Percent = 20m;
        attr3.TypeValue = null;
        attr3.Unit = null;
        attr3.Options = new List<object>();

        dynamic attr4 = new ExpandoObject();
        attr4.AttributeId = 4;
        attr4.Name = "Weight";
        attr4.Percent = 0m;
        attr4.TypeValue = null;
        attr4.Unit = null;
        attr4.Options = new List<object>();

        var attributes = new List<object> { attr1, attr2, attr3, attr4 };

        _mockAttributeRepository
            .Setup(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributes);

        // Act
        var resultObj = await _attributeService.GetAttributesForFilterAsync(CancellationToken.None);
        var json = JsonSerializer.Serialize(resultObj);
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Lấy danh sách thuộc tính để filter thành công.", result.GetProperty("message").GetString());
        var data = result.GetProperty("data");
        Assert.NotNull(data);
        Assert.True(data.GetArrayLength() > 0);
        var suggestion = result.GetProperty("suggestion");
        Assert.NotNull(suggestion);
        var topAttributes = suggestion.GetProperty("topAttributes");
        Assert.NotNull(topAttributes);
        var topAttributesCount = topAttributes.GetArrayLength();
        Assert.Equal(3, topAttributesCount);
        Assert.True(topAttributesCount <= 3);
        var totalPercent = suggestion.GetProperty("totalPercent").GetDecimal();
        Assert.True(totalPercent > 0);
        Assert.True(totalPercent == Math.Round(totalPercent, 1));
        Assert.True(suggestion.TryGetProperty("message", out var messageProp) && messageProp.ValueKind != JsonValueKind.Null);
        _mockAttributeRepository.Verify(r => r.GetAttributesForFilterAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
