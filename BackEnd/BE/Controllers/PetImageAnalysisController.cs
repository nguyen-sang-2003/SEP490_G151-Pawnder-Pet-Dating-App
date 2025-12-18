using BE.DTO;
using BE.Services;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PetImageAnalysisController : ControllerBase
    {
        private readonly IPetImageAnalysisService _analysisService;

        public PetImageAnalysisController(IPetImageAnalysisService analysisService)
        {
            _analysisService = analysisService;
        }

        /// <summary>
        /// Phân tích ảnh thú cưng và trả về các thuộc tính
        /// </summary>
        /// <param name="image">File ảnh thú cưng</param>
        /// <returns>Kết quả phân tích các thuộc tính thú cưng</returns>
        [HttpPost("analyze")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(PetImageAnalysisResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(PetImageAnalysisResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AnalyzeImage(IFormFile image)
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest(new PetImageAnalysisResponse
                {
                    Success = false,
                    Message = "Vui lòng tải lên ảnh thú cưng"
                });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
            if (!allowedTypes.Contains(image.ContentType.ToLower()))
            {
                return BadRequest(new PetImageAnalysisResponse
                {
                    Success = false,
                    Message = "Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP"
                });
            }

            // Validate file size (max 10MB)
            if (image.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new PetImageAnalysisResponse
                {
                    Success = false,
                    Message = "Kích thước ảnh không được vượt quá 10MB"
                });
            }

            var result = await _analysisService.AnalyzeImageAsync(image);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            // Không trả về SQL script
            result.SqlInsertScript = null;

            return Ok(result);
        }

        /// <summary>
        /// Phân tích ảnh và lưu trực tiếp vào database cho pet cụ thể
        /// </summary>
        /// <param name="petId">ID của thú cưng</param>
        /// <param name="image">File ảnh thú cưng</param>
        /// <returns>Kết quả lưu</returns>
        //[HttpPost("analyze-and-save/{petId}")]
        //[Consumes("multipart/form-data")]
        //[ProducesResponseType(typeof(PetImageAnalysisResponse), StatusCodes.Status200OK)]
        //[ProducesResponseType(typeof(PetImageAnalysisResponse), StatusCodes.Status400BadRequest)]
        //public async Task<IActionResult> AnalyzeAndSave(int petId, IFormFile image)
        //{
        //    if (image == null || image.Length == 0)
        //    {
        //        return BadRequest(new PetImageAnalysisResponse
        //        {
        //            Success = false,
        //            Message = "Vui lòng tải lên ảnh thú cưng"
        //        });
        //    }

        //    // Analyze image first
        //    var analysisResult = await _analysisService.AnalyzeImageAsync(image);

        //    if (!analysisResult.Success || analysisResult.Attributes == null)
        //    {
        //        return BadRequest(analysisResult);
        //    }

        //    // Save to database
        //    var saved = await _analysisService.InsertPetCharacteristicsAsync(petId, analysisResult.Attributes);

        //    if (!saved)
        //    {
        //        return BadRequest(new PetImageAnalysisResponse
        //        {
        //            Success = false,
        //            Message = "Không thể lưu dữ liệu vào database. Vui lòng kiểm tra PetId."
        //        });
        //    }

        //    analysisResult.Message = "Phân tích và lưu dữ liệu thành công";
        //    analysisResult.SqlInsertScript = null; // Không trả về SQL
        //    return Ok(analysisResult);
        //}

        /// <summary>
        /// Phân tích nhiều ảnh mèo cùng lúc và trả về kết quả tổng hợp
        /// </summary>
        /// <param name="images">Danh sách file ảnh mèo (tối đa 5 ảnh)</param>
        /// <returns>Kết quả phân tích tổng hợp từ tất cả ảnh</returns>
        [HttpPost("analyze-multiple")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(PetImageAnalysisResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AnalyzeMultipleImages([FromForm] List<IFormFile> images)
        {
            if (images == null || !images.Any())
            {
                return BadRequest(new { message = "Vui lòng tải lên ít nhất một ảnh" });
            }

            // Validate file types
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
            foreach (var image in images)
            {
                if (!allowedTypes.Contains(image.ContentType.ToLower()))
                {
                    return BadRequest(new PetImageAnalysisResponse
                    {
                        Success = false,
                        Message = "Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP"
                    });
                }

                if (image.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new PetImageAnalysisResponse
                    {
                        Success = false,
                        Message = "Kích thước mỗi ảnh không được vượt quá 10MB"
                    });
                }
            }

            // Use new multi-image analysis method
            var result = await _analysisService.AnalyzeImagesAsync(images);
            result.SqlInsertScript = null;

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Phân tích nhiều ảnh và merge kết quả thành một tập thuộc tính duy nhất
        /// </summary>
        /// <param name="images">Danh sách file ảnh thú cưng</param>
        /// <returns>Kết quả phân tích merged từ tất cả ảnh</returns>
        //[HttpPost("analyze-multiple-merged")]
        //[Consumes("multipart/form-data")]
        //[ProducesResponseType(typeof(PetImageAnalysisResponse), StatusCodes.Status200OK)]
        //[ProducesResponseType(StatusCodes.Status400BadRequest)]
        //public async Task<IActionResult> AnalyzeMultipleImagesMerged([FromForm] List<IFormFile> images)
        //{
        //    if (images == null || !images.Any())
        //    {
        //        return BadRequest(new { message = "Vui lòng tải lên ít nhất một ảnh" });
        //    }

        //    if (images.Count > 3)
        //    {
        //        return BadRequest(new { message = "Chỉ cho phép tối đa 3 ảnh mỗi lần" });
        //    }

        //    var allAttributes = new Dictionary<string, AttributeAnalysisResult>();

        //    // Phân tích từng ảnh
        //    foreach (var image in images)
        //    {
        //        var result = await _analysisService.AnalyzeImageAsync(image);
                
        //        if (result.Success && result.Attributes != null)
        //        {
        //            foreach (var attr in result.Attributes)
        //            {
        //                // Nếu thuộc tính chưa có hoặc ảnh hiện tại có độ tin cậy cao hơn, cập nhật
        //                if (!allAttributes.ContainsKey(attr.AttributeName))
        //                {
        //                    allAttributes[attr.AttributeName] = attr;
        //                }
        //                else if (attr.Value.HasValue || !string.IsNullOrEmpty(attr.OptionName))
        //                {
        //                    // Ưu tiên giá trị cụ thể hơn
        //                    allAttributes[attr.AttributeName] = attr;
        //                }
        //            }
        //        }
        //    }

        //    return Ok(new PetImageAnalysisResponse
        //    {
        //        Success = true,
        //        Message = $"Đã phân tích {images.Count} ảnh và tổng hợp kết quả",
        //        Attributes = allAttributes.Values.ToList(),
        //        SqlInsertScript = null
        //    });
        //}

        /// <summary>
        /// Phân tích nhiều ảnh và lưu vào database cho pet cụ thể
        /// </summary>
        /// <param name="petId">ID của thú cưng</param>
        /// <param name="images">Danh sách file ảnh thú cưng</param>
        /// <returns>Kết quả lưu</returns>
        //[HttpPost("analyze-multiple-and-save/{petId}")]
        //[Consumes("multipart/form-data")]
        //[ProducesResponseType(typeof(PetImageAnalysisResponse), StatusCodes.Status200OK)]
        //[ProducesResponseType(StatusCodes.Status400BadRequest)]
        //public async Task<IActionResult> AnalyzeMultipleAndSave(int petId, [FromForm] List<IFormFile> images)
        //{
        //    if (images == null || !images.Any())
        //    {
        //        return BadRequest(new { message = "Vui lòng tải lên ít nhất một ảnh" });
        //    }

        //    if (images.Count > 5)
        //    {
        //        return BadRequest(new { message = "Chỉ cho phép tối đa 5 ảnh mỗi lần" });
        //    }

        //    var allAttributes = new Dictionary<string, AttributeAnalysisResult>();

        //    // Phân tích từng ảnh và merge kết quả
        //    foreach (var image in images)
        //    {
        //        var result = await _analysisService.AnalyzeImageAsync(image);
                
        //        if (result.Success && result.Attributes != null)
        //        {
        //            foreach (var attr in result.Attributes)
        //            {
        //                if (!allAttributes.ContainsKey(attr.AttributeName))
        //                {
        //                    allAttributes[attr.AttributeName] = attr;
        //                }
        //                else if (attr.Value.HasValue || !string.IsNullOrEmpty(attr.OptionName))
        //                {
        //                    allAttributes[attr.AttributeName] = attr;
        //                }
        //            }
        //        }
        //    }

        //    // Lưu vào database
        //    var mergedAttributes = allAttributes.Values.ToList();
        //    var saved = await _analysisService.InsertPetCharacteristicsAsync(petId, mergedAttributes);

        //    if (!saved)
        //    {
        //        return BadRequest(new PetImageAnalysisResponse
        //        {
        //            Success = false,
        //            Message = "Không thể lưu dữ liệu vào database. Vui lòng kiểm tra PetId."
        //        });
        //    }

        //    return Ok(new PetImageAnalysisResponse
        //    {
        //        Success = true,
        //        Message = $"Đã phân tích {images.Count} ảnh và lưu dữ liệu thành công",
        //        Attributes = mergedAttributes,
        //        SqlInsertScript = null
        //    });
        //}
    }
}
