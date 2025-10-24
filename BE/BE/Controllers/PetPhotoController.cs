using BE.DTO;
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
    [Route("api")]
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

        // GET /pet-photo/{petId}
        [HttpGet("pet-photo/{petId:int}")]
        public async Task<IActionResult> GetAllByPet(int petId)
        {
            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted == true)
                return NotFound(new { message = "Không tìm thấy pet." });

            var photos = await _context.PetPhotos
                .Where(p => p.PetId == petId && p.IsDeleted == false)
                .OrderByDescending(p => p.IsPrimary).ThenBy(p => p.SortOrder).ThenBy(p => p.PhotoId)
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
        // POST /pet-photo  (multipart/form-data: petId, files[])
        [HttpPost("pet-photo")]
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
                // 1) Upload Cloudinary
                var (url, publicId) = await _storage.UploadAsync(petId, file, ct);

                // 2) Tính SortOrder
                var maxSort = await _context.PetPhotos
                    .Where(p => p.PetId == petId && p.IsDeleted == false)
                    .MaxAsync(p => (int?)p.SortOrder, ct) ?? -1;

                // 3) Lưu DB
                var photo = new PetPhoto
                {
                    PetId = petId,
                    ImageUrl = url,
                    PublicId = publicId,
                    IsPrimary = existingCount == 0 && saved.Count == 0,
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

        // PUT /pet-photo/{photoId}/primary
        [HttpPut("pet-photo/{photoId:int}/primary")]
        public async Task<IActionResult> SetPrimary(int photoId, CancellationToken ct)
        {
            var photo = await _context.PetPhotos.FindAsync([photoId], ct);
            if (photo == null || photo.IsDeleted) return NotFound(new { message = "Không tìm thấy ảnh." });

            var petId = photo.PetId;

            var others = await _context.PetPhotos
                .Where(p => p.PetId == petId && p.PhotoId != photoId && p.IsDeleted == false)
                .ToListAsync(ct);

            foreach (var p in others)
            {
                if (p.IsPrimary) { p.IsPrimary = false; p.UpdatedAt = DateTime.Now; }
            }

            photo.IsPrimary = true;
            photo.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync(ct);
            return Ok(new { message = "Đặt ảnh đại diện thành công." });
        }

        // PUT /pet-photo/reorder
        [HttpPut("pet-photo/reorder")]
        public async Task<IActionResult> Reorder([FromBody] List<ReorderPhotoRequest> items, CancellationToken ct)
        {
            if (items == null || items.Count == 0)
                return BadRequest(new { message = "Danh sách trống." });

            var ids = items.Select(i => i.PhotoId).ToList();
            var photos = await _context.PetPhotos.Where(p => ids.Contains(p.PhotoId) && p.IsDeleted == false).ToListAsync(ct);
            if (photos.Count != ids.Count) return NotFound(new { message = "Có ảnh không tồn tại." });

            var byId = items.ToDictionary(i => i.PhotoId, i => i.SortOrder);
            foreach (var p in photos)
            {
                p.SortOrder = byId[p.PhotoId];
                p.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync(ct);
            return Ok(new { message = "Cập nhật thứ tự ảnh thành công." });
        }

        // DELETE /pet-photo/{photoId}  (xóa mềm + optional xóa trên Cloudinary)
        [HttpDelete("pet-photo/{photoId:int}")]
        public async Task<IActionResult> Delete(int photoId, [FromQuery] bool hard = false, CancellationToken ct = default)
        {
            var photo = await _context.PetPhotos.FindAsync([photoId], ct);
            if (photo == null || photo.IsDeleted) return NotFound(new { message = "Không tìm thấy ảnh." });

            photo.IsDeleted = true;
            photo.UpdatedAt = DateTime.Now;
            _context.PetPhotos.Update(photo);
            await _context.SaveChangesAsync(ct);

            // Nếu muốn "xoá hẳn" khỏi Cloudinary: /pet-photo/{id}?hard=true
            if (hard && !string.IsNullOrWhiteSpace(photo.PublicId))
            {
                await _storage.DeleteAsync(photo.PublicId, ct);
            }

            return Ok(new { message = "Xóa ảnh thành công." });
        }
    }
}

