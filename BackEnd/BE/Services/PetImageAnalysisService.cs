using BE.DTO;
using BE.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace BE.Services
{
    public interface IPetImageAnalysisService
    {
        Task<PetImageAnalysisResponse> AnalyzeImageAsync(IFormFile image);
        Task<PetImageAnalysisResponse> AnalyzeImagesAsync(List<IFormFile> images);
        Task<string> GenerateSqlInsertScript(int petId, List<AttributeAnalysisResult> attributes);
        Task<bool> InsertPetCharacteristicsAsync(int petId, List<AttributeAnalysisResult> attributes);
    }

    public class PetImageAnalysisService : IPetImageAnalysisService
    {
        private readonly PawnderDatabaseContext _context;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public PetImageAnalysisService(
            PawnderDatabaseContext context, 
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _context = context;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<PetImageAnalysisResponse> AnalyzeImageAsync(IFormFile image)
        {
            try
            {
                // Validate image
                if (image == null || image.Length == 0)
                {
                    return new PetImageAnalysisResponse
                    {
                        Success = false,
                        Message = "Không có ảnh được tải lên"
                    };
                }

                // Convert image to base64
                string base64Image;
                using (var memoryStream = new MemoryStream())
                {
                    await image.CopyToAsync(memoryStream);
                    base64Image = Convert.ToBase64String(memoryStream.ToArray());
                }

                // Get all attributes from database
                var attributes = await _context.Attributes
                    .Include(a => a.AttributeOptions)
                    .Where(a => a.IsDeleted == false)
                    .ToListAsync();

                // Build prompt for AI
                var prompt = BuildAnalysisPrompt(attributes);

                // Call AI API (Google Gemini)
                var analysisResult = await CallGeminiVisionAPI(base64Image, prompt, image.ContentType);

                if (analysisResult == null || !analysisResult.Any())
                {
                    return new PetImageAnalysisResponse
                    {
                        Success = false,
                        Message = "Không thể phân tích ảnh"
                    };
                }

                // Map attribute names to IDs
                await EnrichWithDatabaseIds(analysisResult);

                return new PetImageAnalysisResponse
                {
                    Success = true,
                    Message = "Phân tích ảnh thành công",
                    Attributes = analysisResult,
                    SqlInsertScript = null
                };
            }
            catch (Exception ex)
            {
                return new PetImageAnalysisResponse
                {
                    Success = false,
                    Message = $"Lỗi khi phân tích ảnh: {ex.Message}"
                };
            }
        }

        public async Task<PetImageAnalysisResponse> AnalyzeImagesAsync(List<IFormFile> images)
        {
            try
            {
                // Validate images
                if (images == null || !images.Any())
                {
                    return new PetImageAnalysisResponse
                    {
                        Success = false,
                        Message = "Không có ảnh được tải lên"
                    };
                }

                // Limit to 4 images
                if (images.Count > 4)
                {
                    return new PetImageAnalysisResponse
                    {
                        Success = false,
                        Message = "Chỉ cho phép tối đa 4 ảnh"
                    };
                }

                // Convert all images to base64
                var imageDataList = new List<(string base64, string mimeType)>();
                foreach (var image in images)
                {
                    if (image.Length > 0)
                    {
                        using var memoryStream = new MemoryStream();
                        await image.CopyToAsync(memoryStream);
                        var base64 = Convert.ToBase64String(memoryStream.ToArray());
                        var mimeType = image.ContentType ?? "image/jpeg";
                        imageDataList.Add((base64, mimeType));
                    }
                }

                if (!imageDataList.Any())
                {
                    return new PetImageAnalysisResponse
                    {
                        Success = false,
                        Message = "Không có ảnh hợp lệ"
                    };
                }

                // Get all attributes from database
                var attributes = await _context.Attributes
                    .Include(a => a.AttributeOptions)
                    .Where(a => a.IsDeleted == false)
                    .ToListAsync();

                // Build prompt for AI
                var prompt = BuildAnalysisPrompt(attributes);

                // Call AI API with multiple images
                var analysisResult = await CallGeminiVisionAPIMultiple(imageDataList, prompt);

                if (analysisResult == null || !analysisResult.Any())
                {
                    return new PetImageAnalysisResponse
                    {
                        Success = false,
                        Message = "Không thể phân tích ảnh"
                    };
                }

                // Map attribute names to IDs
                await EnrichWithDatabaseIds(analysisResult);

                return new PetImageAnalysisResponse
                {
                    Success = true,
                    Message = $"Phân tích thành công {images.Count} ảnh",
                    Attributes = analysisResult,
                    SqlInsertScript = null
                };
            }
            catch (Exception ex)
            {
                return new PetImageAnalysisResponse
                {
                    Success = false,
                    Message = $"Lỗi khi phân tích ảnh: {ex.Message}"
                };
            }
        }

        private string BuildAnalysisPrompt(List<Models.Attribute> attributes)
        {
            var promptBuilder = new StringBuilder();
            promptBuilder.AppendLine("QUAN TRỌNG: Chỉ chấp nhận ảnh MÈO.");
            promptBuilder.AppendLine("- Kiểm tra từng ảnh theo thứ tự (ảnh 1, ảnh 2, ảnh 3...).");
            promptBuilder.AppendLine("- TÌM ẢNH MÈO ĐẦU TIÊN và chỉ phân tích ảnh đó. Bỏ qua các ảnh còn lại.");
            promptBuilder.AppendLine("- Nếu ảnh đó có nhiều mèo → chỉ phân tích con mèo đầu tiên từ bên trái.");
            promptBuilder.AppendLine("- Nếu KHÔNG có ảnh mèo nào trong tất cả các ảnh → trả về: {\"isCat\":false}");
            promptBuilder.AppendLine();
            promptBuilder.AppendLine("Nếu tìm thấy ảnh mèo, phân tích và trả về 1 JSON DUY NHẤT:");
            promptBuilder.AppendLine();

            foreach (var attr in attributes)
            {
                promptBuilder.AppendLine($"- {attr.Name} ({attr.TypeValue})");
                
                if (attr.AttributeOptions.Any())
                {
                    var options = string.Join(", ", attr.AttributeOptions.Select(o => o.Name));
                    promptBuilder.AppendLine($"  Tùy chọn: {options}");
                }
                else if (attr.TypeValue == "float" || attr.TypeValue == "int")
                {
                    promptBuilder.AppendLine($"  Đơn vị: {attr.Unit}");
                }
            }

            promptBuilder.AppendLine();
            promptBuilder.AppendLine("Format trả về:");
            promptBuilder.AppendLine("{\"isCat\":true,\"attributes\":[{\"attributeName\":\"Giống\",\"optionName\":\"Mèo Ba Tư\"},{\"attributeName\":\"Cân nặng\",\"value\":5}]}");
            promptBuilder.AppendLine();
            promptBuilder.AppendLine("LƯU Ý QUAN TRỌNG:");
            promptBuilder.AppendLine("- CHỈ trả về ĐÚNG 1 JSON object, KHÔNG có text giải thích, KHÔNG có markdown code block.");
            promptBuilder.AppendLine("- KHÔNG bọc JSON trong ```json hoặc bất kỳ ký tự nào.");
            promptBuilder.AppendLine("- Response phải bắt đầu trực tiếp bằng ký tự { và kết thúc bằng }");

            return promptBuilder.ToString();
        }

        private async Task<List<AttributeAnalysisResult>?> CallGeminiVisionAPI(string base64Image, string prompt, string contentType)
        {
            try
            {
                var apiKey = _configuration["GeminiAI:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    throw new Exception("Chưa cấu hình Gemini API Key");
                }

                // Sử dụng gemini-1.5-flash vì stable và hỗ trợ vision tốt
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

                var mimeType = contentType;
                if (string.IsNullOrEmpty(mimeType) || !mimeType.StartsWith("image/"))
                {
                    mimeType = "image/jpeg";
                }

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new object[]
                            {
                                new { text = prompt },
                                new
                                {
                                    inline_data = new
                                    {
                                        mime_type = mimeType,
                                        data = base64Image
                                    }
                                }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.1,  // Thấp hơn để JSON output nhất quán
                        topK = 32,
                        topP = 1,
                        maxOutputTokens = 1024  // Giảm để nhanh hơn
                    }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, httpContent);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Gemini Vision API Error: Status={response.StatusCode}, Content={responseContent}");
                    
                    // Check for specific errors
                    if (responseContent.Contains("location") || responseContent.Contains("FAILED_PRECONDITION"))
                    {
                        throw new Exception("Gemini API không khả dụng từ khu vực này. Vui lòng kiểm tra region Azure hoặc API key.");
                    }
                    else if (responseContent.Contains("API key"))
                    {
                        throw new Exception("API key không hợp lệ hoặc chưa được cấu hình.");
                    }
                    else if (responseContent.Contains("quota") || responseContent.Contains("429"))
                    {
                        throw new Exception("Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau.");
                    }
                    
                    throw new Exception($"Gemini API error ({response.StatusCode}): {responseContent}");
                }

                // Parse response
                Console.WriteLine($" Gemini Vision API Success. Response length: {responseContent.Length}");
                
                var geminiResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                // Check if response has candidates
                if (!geminiResponse.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
                {
                    Console.WriteLine($" No candidates in response: {responseContent}");
                    throw new Exception("AI không thể phân tích ảnh này. Vui lòng thử ảnh khác.");
                }
                
                var text = candidates[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();
                
                Console.WriteLine($"AI Response: {text?.Substring(0, Math.Min(200, text?.Length ?? 0))}...");

                // Extract JSON from response
                var jsonStart = text?.IndexOf('{') ?? -1;
                var jsonEnd = text?.LastIndexOf('}') ?? -1;

                if (jsonStart >= 0 && jsonEnd > jsonStart)
                {
                    var jsonText = text!.Substring(jsonStart, jsonEnd - jsonStart + 1);
                    
                    using var document = JsonDocument.Parse(jsonText);
                    var root = document.RootElement;
                    
                    // Check if it's a cat
                    if (root.TryGetProperty("isCat", out var isCatElement))
                    {
                        var isCat = isCatElement.GetBoolean();
                        if (!isCat)
                        {
                            throw new Exception("Ảnh không phải là mèo. Vui lòng tải lên ảnh mèo.");
                        }
                        
                        // Parse attributes array
                        if (root.TryGetProperty("attributes", out var attributesElement))
                        {
                            var result = ParseAttributeResults(attributesElement.GetRawText());
                            return result;
                        }
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error calling Gemini API: {ex.Message}");
                throw;
            }
        }

        private async Task<List<AttributeAnalysisResult>?> CallGeminiVisionAPIMultiple(List<(string base64, string mimeType)> images, string prompt)
        {
            try
            {
                var apiKey = _configuration["GeminiAI:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    throw new Exception("Chưa cấu hình Gemini API Key");
                }

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

                // Build parts array with prompt and all images
                var parts = new List<object> { new { text = prompt } };
                foreach (var (base64, mimeType) in images)
                {
                    parts.Add(new
                    {
                        inline_data = new
                        {
                            mime_type = mimeType.StartsWith("image/") ? mimeType : "image/jpeg",
                            data = base64
                        }
                    });
                }

                var requestBody = new
                {
                    contents = new[]
                    {
                        new { parts = parts.ToArray() }
                    },
                    generationConfig = new
                    {
                        temperature = 0.1,
                        topK = 32,
                        topP = 1,
                        maxOutputTokens = 4069
                    }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, httpContent);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($" Gemini Vision API Error: Status={response.StatusCode}, Content={responseContent}");
                    
                    if (responseContent.Contains("location") || responseContent.Contains("FAILED_PRECONDITION"))
                    {
                        throw new Exception(" Gemini API không khả dụng từ khu vực này.");
                    }
                    else if (responseContent.Contains("API key"))
                    {
                        throw new Exception(" API key không hợp lệ.");
                    }
                    else if (responseContent.Contains("quota") || responseContent.Contains("429"))
                    {
                        throw new Exception(" Đã vượt quá giới hạn API.");
                    }
                    
                    throw new Exception($"Gemini API error ({response.StatusCode}): {responseContent}");
                }

                Console.WriteLine($" Gemini Vision API Success (Multi-image). Response length: {responseContent.Length}");
                
                var geminiResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                if (!geminiResponse.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
                {
                    throw new Exception("AI không thể phân tích ảnh này.");
                }
                
                var text = candidates[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();
                
                Console.WriteLine($" AI Response (Multi): {text?.Substring(0, Math.Min(500, text?.Length ?? 0))}...");

                var jsonStart = text?.IndexOf('{') ?? -1;
                var jsonEnd = text?.LastIndexOf('}') ?? -1;

                if (jsonStart >= 0 && jsonEnd > jsonStart)
                {
                    var jsonText = text!.Substring(jsonStart, jsonEnd - jsonStart + 1);
                    
                    Console.WriteLine($" Extracted JSON: {jsonText.Substring(0, Math.Min(300, jsonText.Length))}...");
                    
                    try
                    {
                        using var document = JsonDocument.Parse(jsonText);
                        var root = document.RootElement;
                        
                        if (root.TryGetProperty("isCat", out var isCatElement))
                        {
                            var isCat = isCatElement.GetBoolean();
                            if (!isCat)
                            {
                                throw new Exception("Không có ảnh mèo trong các ảnh đã tải lên. Vui lòng tải lên ảnh mèo.");
                            }
                            
                            if (root.TryGetProperty("attributes", out var attributesElement))
                            {
                                return ParseAttributeResults(attributesElement.GetRawText());
                            }
                        }
                    }
                    catch (JsonException jsonEx)
                    {
                        Console.WriteLine($" JSON Parse Error: {jsonEx.Message}");
                        Console.WriteLine($" Full AI Response: {text}");
                        throw new Exception($"AI trả về JSON không hợp lệ. Vui lòng thử lại.");
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error calling Gemini API (Multi): {ex.Message}");
                throw;
            }
        }

        private List<AttributeAnalysisResult> ParseAttributeResults(string jsonText)
        {
            var results = new List<AttributeAnalysisResult>();
            
            try
            {
                using var document = JsonDocument.Parse(jsonText);
                var root = document.RootElement;

                foreach (var item in root.EnumerateArray())
                {
                    var result = new AttributeAnalysisResult();

                    // Parse attributeName
                    if (item.TryGetProperty("attributeName", out var attrName))
                    {
                        result.AttributeName = attrName.GetString() ?? "";
                    }

                    // Parse optionName
                    if (item.TryGetProperty("optionName", out var optName) && optName.ValueKind != JsonValueKind.Null)
                    {
                        result.OptionName = optName.GetString();
                    }

                    // Parse value - handle both string and number
                    if (item.TryGetProperty("value", out var valueElement))
                    {
                        if (valueElement.ValueKind == JsonValueKind.Number)
                        {
                            if (valueElement.TryGetInt32(out var intValue))
                            {
                                result.Value = intValue;
                            }
                            else if (valueElement.TryGetDouble(out var doubleValue))
                            {
                                result.Value = (int)Math.Round(doubleValue);
                            }
                        }
                        else if (valueElement.ValueKind == JsonValueKind.String)
                        {
                            var strValue = valueElement.GetString();
                            if (!string.IsNullOrEmpty(strValue) && int.TryParse(strValue, out var parsedValue))
                            {
                                result.Value = parsedValue;
                            }
                        }
                    }

                    results.Add(result);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing attribute results: {ex.Message}");
            }

            return results;
        }

        private async Task EnrichWithDatabaseIds(List<AttributeAnalysisResult> results)
        {
            foreach (var result in results)
            {
                // Find attribute by name
                var attribute = await _context.Attributes
                    .Include(a => a.AttributeOptions)
                    .FirstOrDefaultAsync(a => a.Name == result.AttributeName && a.IsDeleted == false);

                if (attribute != null)
                {
                    result.AttributeId = attribute.AttributeId;

                    // Find option by name if exists
                    if (!string.IsNullOrEmpty(result.OptionName))
                    {
                        var option = attribute.AttributeOptions
                            .FirstOrDefault(o => o.Name == result.OptionName && o.IsDeleted == false);

                        if (option != null)
                        {
                            result.OptionId = option.OptionId;
                        }
                    }
                }
            }
        }

        public async Task<string> GenerateSqlInsertScript(int petId, List<AttributeAnalysisResult> attributes)
        {
            var sqlBuilder = new StringBuilder();
            sqlBuilder.AppendLine("-- Auto-generated PetCharacteristic INSERT statements");
            sqlBuilder.AppendLine($"-- Generated at: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            sqlBuilder.AppendLine();

            foreach (var attr in attributes.Where(a => a.AttributeId.HasValue))
            {
                if (attr.OptionId.HasValue)
                {
                    // Option-based attribute
                    sqlBuilder.AppendLine($"INSERT INTO \"PetCharacteristic\" (\"PetId\", \"AttributeId\", \"OptionId\") VALUES");
                    if (petId > 0)
                    {
                        sqlBuilder.AppendLine($"({petId}, {attr.AttributeId}, {attr.OptionId});");
                    }
                    else
                    {
                        sqlBuilder.AppendLine($"((SELECT \"PetId\" FROM \"Pet\" WHERE \"Name\" = 'YOUR_PET_NAME'), {attr.AttributeId}, {attr.OptionId});");
                    }
                }
                else if (attr.Value.HasValue)
                {
                    // Value-based attribute
                    sqlBuilder.AppendLine($"INSERT INTO \"PetCharacteristic\" (\"PetId\", \"AttributeId\", \"Value\") VALUES");
                    if (petId > 0)
                    {
                        sqlBuilder.AppendLine($"({petId}, {attr.AttributeId}, {attr.Value});");
                    }
                    else
                    {
                        sqlBuilder.AppendLine($"((SELECT \"PetId\" FROM \"Pet\" WHERE \"Name\" = 'YOUR_PET_NAME'), {attr.AttributeId}, {attr.Value});");
                    }
                }
                sqlBuilder.AppendLine();
            }

            return sqlBuilder.ToString();
        }

        public async Task<bool> InsertPetCharacteristicsAsync(int petId, List<AttributeAnalysisResult> attributes)
        {
            try
            {
                // Check if pet exists
                var pet = await _context.Pets.FindAsync(petId);
                if (pet == null)
                {
                    return false;
                }

                foreach (var attr in attributes.Where(a => a.AttributeId.HasValue))
                {
                    var characteristic = new PetCharacteristic
                    {
                        PetId = petId,
                        AttributeId = attr.AttributeId!.Value,
                        OptionId = attr.OptionId,
                        Value = attr.Value
                    };

                    // Check if exists
                    var existing = await _context.PetCharacteristics
                        .FirstOrDefaultAsync(pc => pc.PetId == petId && pc.AttributeId == attr.AttributeId);

                    if (existing != null)
                    {
                        // Update
                        existing.OptionId = attr.OptionId;
                        existing.Value = attr.Value;
                        existing.UpdatedAt = DateTime.Now;
                    }
                    else
                    {
                        // Insert
                        _context.PetCharacteristics.Add(characteristic);
                    }
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
