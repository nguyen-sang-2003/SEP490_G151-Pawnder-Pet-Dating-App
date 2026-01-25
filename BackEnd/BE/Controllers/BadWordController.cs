using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho quản lý từ cấm - chỉ dành cho Admin
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class BadWordController : ControllerBase
    {
        private readonly IBadWordManagementService _badWordManagementService;

        public BadWordController(IBadWordManagementService badWordManagementService)
        {
            _badWordManagementService = badWordManagementService;
        }

        // GET /api/badword
        [HttpGet]
        public async Task<IActionResult> GetAllBadWords(CancellationToken ct = default)
        {
            try
            {
                var badWords = await _badWordManagementService.GetAllBadWordsAsync(ct);
                return Ok(badWords);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /api/badword/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBadWordById(int id, CancellationToken ct = default)
        {
            try
            {
                var badWord = await _badWordManagementService.GetBadWordByIdAsync(id, ct);
                if (badWord == null)
                    return NotFound(new { Message = "Không tìm thấy từ cấm." });

                return Ok(badWord);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /api/badword
        [HttpPost]
        public async Task<IActionResult> CreateBadWord([FromBody] CreateBadWordRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _badWordManagementService.CreateBadWordAsync(request, ct);
                return CreatedAtAction(nameof(GetBadWordById), new { id = result.BadWordId }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT /api/badword/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBadWord(int id, [FromBody] UpdateBadWordRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _badWordManagementService.UpdateBadWordAsync(id, request, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // DELETE /api/badword/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBadWord(int id, CancellationToken ct = default)
        {
            try
            {
                var success = await _badWordManagementService.DeleteBadWordAsync(id, ct);
                if (success)
                    return Ok(new { Message = "Xóa từ cấm thành công." });
                
                return NotFound(new { Message = "Không tìm thấy từ cấm." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /api/badword/reload-cache
        [HttpPost("reload-cache")]
        public async Task<IActionResult> ReloadCache(CancellationToken ct = default)
        {
            try
            {
                await _badWordManagementService.ReloadCacheAsync(ct);
                return Ok(new { Message = "Đã reload cache thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }
    }
}

