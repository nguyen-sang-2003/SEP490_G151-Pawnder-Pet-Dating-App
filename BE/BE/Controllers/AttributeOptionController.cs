using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho AttributeOption - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AttributeOptionController : Controller
    {
        private readonly IAttributeOptionService _optionService;

        public AttributeOptionController(IAttributeOptionService optionService)
        {
            _optionService = optionService;
        }

        // GET /attribute-option
        [HttpGet("attribute-option")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> GetAllOptions(CancellationToken ct = default)
        {
            try
            {
                var options = await _optionService.GetAllOptionsAsync(ct);
                return Ok(options);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /api/attribute-option/{attributeId}
        [HttpGet("{attributeId}")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> GetOptionsByAttribute(int attributeId, CancellationToken ct = default)
        {
            try
            {
                var options = await _optionService.GetOptionsByAttributeIdAsync(attributeId, ct);
                return Ok(options);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /attribute-option/{AttributeId}
        [HttpPost("attribute-option/{attributeId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateOption(int attributeId, [FromBody] string optionName, CancellationToken ct = default)
        {
            try
            {
                var result = await _optionService.CreateOptionAsync(attributeId, optionName, ct);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT /attribute-option/{optionId}
        [HttpPut("attribute-option/{optionId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOptions(int optionId, [FromBody] string optionNames, CancellationToken ct = default)
        {
            try
            {
                var success = await _optionService.UpdateOptionAsync(optionId, optionNames, ct);
                return Ok(new { message = "Cập nhật danh sách option thành công." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // DELETE /attribute-option/{OptionId}
        [HttpDelete("attribute-option/{optionId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteOption(int optionId, CancellationToken ct = default)
        {
            try
            {
                var success = await _optionService.DeleteOptionAsync(optionId, ct);
                
                if (!success)
                    return NotFound(new { message = "Không tìm thấy option." });

                return Ok(new { message = "Xóa option thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }
    }
}
