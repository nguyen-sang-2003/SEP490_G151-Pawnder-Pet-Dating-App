using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/petphoto")]
    public class PetPhotoController : ControllerBase
    {
        private readonly PawnderDatabaseContext _context;
        private readonly IPhotoStorage _storage;
        private const int MaxPhotosPerPet = 6;

        public PetPhotoController(PawnderDatabaseContext context, IPhotoStorage storage)
        {
            _context = context;
            _storage = storage;
        }

        // GET /api/petphoto/{petId}
        [HttpGet("{petId:int}")]
        public async Task<IActionResult> GetAllByPet(int petId)
        {
            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted == true)
                return NotFound(new { message = "Không tìm thấy pet." });

            var photos = await _context.PetPhotos
                .Where(p => p.PetId == petId && p.IsDeleted == false)
                .OrderBy(p => p.SortOrder).ThenBy(p => p.PhotoId)
                .Select(p => new PetPhotoResponse
                {
                    PhotoId = p.PhotoId,
                    PetId = p.PetId,
                    Url = p.ImageUrl,
                    IsPrimary = p.IsPrimary,
                    SortOrder = p.SortOrder
                })
                .ToListAsync();

            return Ok(photos);
        }

        // POST /api/petphoto  (multipart/form-data: petId, files[])
        [HttpPost]
        [RequestSizeLimit(20_000_000)]
        public async Task<IActionResult> Upload([FromForm] int petId, [FromForm] List<IFormFile> files, CancellationToken ct)
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { message = "Chưa chọn ảnh." });

            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted == true)
                return NotFound(new { message = "Không tìm thấy pet." });

            var existingCount = await _context.PetPhotos.CountAsync(p => p.PetId == petId && p.IsDeleted == false, ct);
            if (existingCount + files.Count > MaxPhotosPerPet)
                return BadRequest(new { message = $"Tối đa {MaxPhotosPerPet} ảnh cho mỗi pet." });

            var saved = new List<PetPhotoResponse>();

            foreach (var file in files)
            {
                var (url, publicId) = await _storage.UploadAsync(petId, file, ct);
                var maxSort = await _context.PetPhotos
                    .Where(p => p.PetId == petId && p.IsDeleted == false)
                    .MaxAsync(p => (int?)p.SortOrder, ct) ?? -1;

                var photo = new PetPhoto
                {
                    PetId = petId,
                    ImageUrl = url,
                    PublicId = publicId,
                    IsPrimary = false, // Not used anymore - SortOrder determines primary
                    SortOrder = maxSort + 1,
                    IsDeleted = false,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.PetPhotos.Add(photo);
                await _context.SaveChangesAsync(ct);

                saved.Add(new PetPhotoResponse
                {
                    PhotoId = photo.PhotoId,
                    PetId = petId,
                    Url = url,
                    IsPrimary = photo.IsPrimary,
                    SortOrder = photo.SortOrder
                });
            }

            return Ok(new { message = "Tải ảnh thành công.", photos = saved });
        }

        // PUT /api/petphoto/reorder
        [HttpPut("reorder")]
        public async Task<IActionResult> Reorder([FromBody] List<ReorderPhotoRequest> items, CancellationToken ct)
        {
            if (items == null || items.Count == 0)
                return BadRequest(new { message = "Danh sách trống." });

            var ids = items.Select(i => i.PhotoId).ToList();
            var photos = await _context.PetPhotos.Where(p => ids.Contains(p.PhotoId) && p.IsDeleted == false).ToListAsync(ct);
            if (photos.Count != ids.Count)
                return NotFound(new { message = "Có ảnh không tồn tại." });

            var byId = items.ToDictionary(i => i.PhotoId, i => i.SortOrder);
            foreach (var p in photos)
            {
                p.SortOrder = byId[p.PhotoId];
                p.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync(ct);
            return Ok(new { message = "Cập nhật thứ tự ảnh thành công." });
        }

        // DELETE /api/petphoto/{photoId}
        [HttpDelete("{photoId:int}")]
        public async Task<IActionResult> Delete(int photoId, [FromQuery] bool hard = false, CancellationToken ct = default)
        {
            var photo = await _context.PetPhotos.FindAsync([photoId], ct);
            if (photo == null || photo.IsDeleted)
                return NotFound(new { message = "Không tìm thấy ảnh." });

            photo.IsDeleted = true;
            photo.UpdatedAt = DateTime.Now;
            _context.PetPhotos.Update(photo);
            await _context.SaveChangesAsync(ct);

            if (hard && !string.IsNullOrWhiteSpace(photo.PublicId))
                await _storage.DeleteAsync(photo.PublicId, ct);

            return Ok(new { message = "Xóa ảnh thành công." });
        }
    }
}
