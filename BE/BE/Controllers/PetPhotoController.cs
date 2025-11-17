using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho PetPhoto - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/petphoto")]
    public class PetPhotoController : ControllerBase
    {
        private readonly IPetPhotoService _photoService;

        public PetPhotoController(IPetPhotoService photoService)
        {
            _photoService = photoService;
        }

        // GET /api/petphoto/{petId}
        [HttpGet("{petId:int}")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> GetAllByPet(int petId, CancellationToken ct = default)
        {
            try
            {
                var photos = await _photoService.GetPhotosByPetIdAsync(petId, ct);
                return Ok(photos);
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

        // POST /api/petphoto (multipart/form-data: petId, files[])
        [HttpPost]
        [Authorize(Roles = "User")]
        [RequestSizeLimit(20_000_000)]
        public async Task<IActionResult> Upload([FromForm] int petId, [FromForm] List<IFormFile> files, CancellationToken ct = default)
        {
            try
            {
                var saved = await _photoService.UploadPhotosAsync(petId, files, ct);
                return Ok(new { message = "Tải ảnh thành công.", photos = saved });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT /api/petphoto/reorder
        [HttpPut("reorder")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> Reorder([FromBody] List<ReorderPhotoRequest> items, CancellationToken ct = default)
        {
            try
            {
                var success = await _photoService.ReorderPhotosAsync(items, ct);
                return Ok(new { message = "Cập nhật thứ tự ảnh thành công." });
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

        // DELETE /api/petphoto/{photoId}
        [HttpDelete("{photoId:int}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> Delete(int photoId, [FromQuery] bool hard = false, CancellationToken ct = default)
        {
            try
            {
                var success = await _photoService.DeletePhotoAsync(photoId, hard, ct);
                
                if (!success)
                    return NotFound(new { message = "Không tìm thấy ảnh." });

                return Ok(new { message = "Xóa ảnh thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }
    }
}
