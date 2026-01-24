using BE.Repositories.Interfaces;
using BE.Services;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace BE.Tests.Services.BadWordServiceTest;

/// <summary>
/// Unit Tests cho BadWordService.NormalizeText
/// Dựa trên bảng thống kê test cases BANG_THONG_KE_TEST_CASES_NORMALIZE_TEXT.txt
/// </summary>
public class NormalizeTextTest
{
    private readonly Mock<IBadWordRepository> _mockBadWordRepository;
    private readonly IMemoryCache _cache;
    private readonly BadWordService _service;

    public NormalizeTextTest()
    {
        _mockBadWordRepository = new Mock<IBadWordRepository>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _service = new BadWordService(_mockBadWordRepository.Object, _cache);
    }

    /// <summary>
    /// UTCID01: Normal case - text: null
    /// Expected: Returns empty string
    /// </summary>
    [Fact]
    public void UTCID01_NormalizeText_NullText_ReturnsEmpty()
    {
        // Arrange
        string? text = null;

        // Act
        var result = _service.NormalizeText(text!);

        // Assert
        Assert.Equal(string.Empty, result);
    }

    /// <summary>
    /// UTCID02: Normal case - text: "" (empty)
    /// Expected: Returns empty string
    /// </summary>
    [Fact]
    public void UTCID02_NormalizeText_EmptyText_ReturnsEmpty()
    {
        // Arrange
        string text = "";

        // Act
        var result = _service.NormalizeText(text);

        // Assert
        Assert.Equal(string.Empty, result);
    }

    /// <summary>
    /// UTCID03: Normal case - text: "   " (whitespace)
    /// Expected: Returns empty string (whitespace removed)
    /// </summary>
    [Fact]
    public void UTCID03_NormalizeText_WhitespaceText_ReturnsEmpty()
    {
        // Arrange
        string text = "   ";

        // Act
        var result = _service.NormalizeText(text);

        // Assert
        Assert.Equal(string.Empty, result);
    }

    /// <summary>
    /// UTCID04: Normal case - text: "Hello" (normal text, no spaces)
    /// Expected: Returns "hello" (lowercase, no spaces, no special characters)
    /// </summary>
    [Fact]
    public void UTCID04_NormalizeText_NormalText_ReturnsLowercase()
    {
        // Arrange
        string text = "Hello";

        // Act
        var result = _service.NormalizeText(text);

        // Assert
        Assert.Equal("hello", result);
        Assert.DoesNotContain(" ", result);
    }

    /// <summary>
    /// UTCID05: Normal case - text: "Hello World" (with spaces)
    /// Expected: Returns "helloworld" (lowercase, spaces removed)
    /// </summary>
    [Fact]
    public void UTCID05_NormalizeText_TextWithSpaces_RemovesSpaces()
    {
        // Arrange
        string text = "Hello World";

        // Act
        var result = _service.NormalizeText(text);

        // Assert
        Assert.Equal("helloworld", result);
        Assert.DoesNotContain(" ", result);
    }

    /// <summary>
    /// UTCID06: Normal case - text: "sp@m w0rd" (with special chars and numbers)
    /// Expected: Returns normalized text with special chars removed and numbers replaced
    /// Note: @ is removed by special char regex first, then numbers are replaced
    /// </summary>
    [Fact]
    public void UTCID06_NormalizeText_SpecialCharsAndNumbers_NormalizesCorrectly()
    {
        // Arrange
        string text = "sp@m w0rd";

        // Act
        var result = _service.NormalizeText(text);

        // Assert
        Assert.DoesNotContain("@", result);
        Assert.DoesNotContain("0", result);
        Assert.DoesNotContain(" ", result);
        // @ is removed (special char), 0 -> o
        Assert.Contains("o", result); // 0 replaced with o
        Assert.Equal("spmword", result); // sp@m w0rd -> spm w0rd -> spmw0rd -> spmword
    }

    /// <summary>
    /// UTCID07: Normal case - text: "aaabbb" (repeated characters)
    /// Expected: Returns text with repeated chars reduced (aaa->aa)
    /// </summary>
    [Fact]
    public void UTCID07_NormalizeText_RepeatedChars_ReducesRepeats()
    {
        // Arrange
        string text = "aaabbb";

        // Act
        var result = _service.NormalizeText(text);

        // Assert
        // aaa -> aa, bbb -> bb
        Assert.Equal("aabb", result);
    }

    /// <summary>
    /// UTCID08: Normal case - text: "HELLO" (uppercase)
    /// Expected: Returns "hello" (lowercase)
    /// </summary>
    [Fact]
    public void UTCID08_NormalizeText_UppercaseText_ReturnsLowercase()
    {
        // Arrange
        string text = "HELLO";

        // Act
        var result = _service.NormalizeText(text);

        // Assert
        Assert.Equal("hello", result);
        Assert.True(result == result.ToLower());
    }
}

