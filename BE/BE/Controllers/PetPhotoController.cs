using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PetPhotoController : Controller
    {
        private readonly PawnderDatabaseContext _context;

        public PetPhotoController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // GET /api/petphoto/{petId}
        [HttpGet("{petId}")]
        public async Task<IActionResult> GetPhotosByPet(int petId)
        {
            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted != false)
                return NotFound(new { message = "Không tìm thấy thú cưng." });

            var photos = await _context.PetPhotos
                .Where(p => p.PetId == petId)
                .OrderBy(p => p.CreatedAt)
                .Select(p => new
                {
                    PhotoId = p.PhotoId,
                    ImageUrl = p.ImageUrl,
                    PetId = p.PetId,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(photos);
        }

        // POST /api/petphoto/{petId}
        [HttpPost("{petId}")]
        public async Task<IActionResult> CreatePetPhoto(int petId, [FromBody] string imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return BadRequest(new { message = "URL hình ảnh không được để trống." });

            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted != false)
                return NotFound(new { message = "Không tìm thấy thú cưng." });

            var petPhoto = new PetPhoto
            {
                PetId = petId,
                ImageUrl = imageUrl.Trim(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.PetPhotos.Add(petPhoto);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm ảnh thành công.",
                PhotoId = petPhoto.PhotoId,
                ImageUrl = petPhoto.ImageUrl
            });
        }

        // POST /api/petphoto/{petId}/batch
        [HttpPost("{petId}/batch")]
        public async Task<IActionResult> CreatePetPhotosBatch(int petId, [FromBody] List<string> imageUrls)
        {
            if (imageUrls == null || imageUrls.Count == 0)
                return BadRequest(new { message = "Danh sách URL không được để trống." });

            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted != false)
                return NotFound(new { message = "Không tìm thấy thú cưng." });

            var petPhotos = imageUrls
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Select(url => new PetPhoto
                {
                    PetId = petId,
                    ImageUrl = url.Trim(),
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                })
                .ToList();

            if (petPhotos.Count == 0)
                return BadRequest(new { message = "Không có URL hợp lệ." });

            _context.PetPhotos.AddRange(petPhotos);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Thêm {petPhotos.Count} ảnh thành công.",
                count = petPhotos.Count,
                photos = petPhotos.Select(p => new { p.PhotoId, p.ImageUrl })
            });
        }

        // DELETE /api/petphoto/{photoId}
        [HttpDelete("{photoId}")]
        public async Task<IActionResult> DeletePetPhoto(int photoId)
        {
            var photo = await _context.PetPhotos.FindAsync(photoId);
            if (photo == null)
                return NotFound(new { message = "Không tìm thấy ảnh." });

            _context.PetPhotos.Remove(photo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa ảnh thành công." });
        }
    }
}

