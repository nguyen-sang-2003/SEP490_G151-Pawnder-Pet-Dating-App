using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class PetPhotoService : IPetPhotoService
    {
        private readonly IPetPhotoRepository _photoRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly IPhotoStorage _storage;
        
        // BR-03: Mỗi pet tối đa 4 ảnh
        private const int MaxPhotosPerPet = 4;
        
        // Image validation constants
        private const long MaxImageSizeBytes = 5 * 1024 * 1024; // 5MB
        private static readonly string[] AllowedImageTypes = { "image/jpeg", "image/jpg", "image/png", "image/webp" };
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

        public PetPhotoService(
            IPetPhotoRepository photoRepository,
            PawnderDatabaseContext context,
            IPhotoStorage storage)
        {
            _photoRepository = photoRepository;
            _context = context;
            _storage = storage;
        }

        /// <summary>
        /// Validate image file (size and format)
        /// </summary>
        private void ValidateImageFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File ảnh không hợp lệ.");

            // Validate file size (max 5MB)
            if (file.Length > MaxImageSizeBytes)
                throw new ArgumentException($"Kích thước ảnh không được vượt quá 5MB. File '{file.FileName}' có kích thước {file.Length / (1024 * 1024.0):F2}MB.");

            // Validate content type
            var contentType = file.ContentType?.ToLower();
            if (string.IsNullOrEmpty(contentType) || !AllowedImageTypes.Contains(contentType))
                throw new ArgumentException($"Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP. File '{file.FileName}' có định dạng '{contentType}'.");

            // Validate file extension
            var extension = Path.GetExtension(file.FileName)?.ToLower();
            if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                throw new ArgumentException($"Phần mở rộng file không hợp lệ. Chỉ chấp nhận .jpg, .jpeg, .png, .webp. File '{file.FileName}' có phần mở rộng '{extension}'.");
        }

        public async Task<IEnumerable<PetPhotoResponse>> GetPhotosByPetIdAsync(int petId, CancellationToken ct = default)
        {
            var pet = await _context.Pets.FindAsync([petId], ct);
            if (pet == null || pet.IsDeleted == true)
                throw new KeyNotFoundException("Không tìm thấy pet.");

            return await _photoRepository.GetPhotosByPetIdAsync(petId, ct);
        }

        public async Task<IEnumerable<PetPhotoResponse>> UploadPhotosAsync(int petId, List<IFormFile> files, CancellationToken ct = default)
        {
            if (files == null || files.Count == 0)
                throw new ArgumentException("Chưa chọn ảnh.");

            // Validate all files first before processing
            foreach (var file in files)
            {
                ValidateImageFile(file);
            }

            var pet = await _context.Pets.FindAsync([petId], ct);
            if (pet == null || pet.IsDeleted == true)
                throw new KeyNotFoundException("Không tìm thấy pet.");

            var existingCount = await _photoRepository.GetPhotoCountByPetIdAsync(petId, ct);
            if (existingCount + files.Count > MaxPhotosPerPet)
                throw new InvalidOperationException($"Tối đa {MaxPhotosPerPet} ảnh cho mỗi pet. Hiện có {existingCount} ảnh, không thể thêm {files.Count} ảnh.");

            // Kiểm tra xem đã có ảnh chính chưa
            var hasPrimaryPhoto = await _context.PetPhotos
                .AnyAsync(p => p.PetId == petId && p.IsDeleted == false && p.IsPrimary == true, ct);

            var saved = new List<PetPhotoResponse>();
            var isFirstPhoto = true;

            foreach (var file in files)
            {
                var (url, publicId) = await _storage.UploadAsync(petId, file, ct);
                var maxSort = await _photoRepository.GetMaxSortOrderAsync(petId, ct) ?? -1;

                // Primary Photo Rule: Ảnh đầu tiên tự động là ảnh chính nếu chưa có
                var isPrimary = !hasPrimaryPhoto && isFirstPhoto;

                var photo = new PetPhoto
                {
                    PetId = petId,
                    ImageUrl = url,
                    PublicId = publicId,
                    IsPrimary = isPrimary,
                    SortOrder = maxSort + 1,
                    IsDeleted = false,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                await _photoRepository.AddAsync(photo, ct);

                if (isPrimary)
                    hasPrimaryPhoto = true; // Đã set ảnh chính

                isFirstPhoto = false;

                saved.Add(new PetPhotoResponse
                {
                    PhotoId = photo.PhotoId,
                    PetId = petId,
                    Url = url,
                    IsPrimary = photo.IsPrimary,
                    SortOrder = photo.SortOrder
                });
            }

            return saved;
        }

        /// <summary>
        /// Set ảnh làm ảnh chính (Primary Photo)
        /// </summary>
        public async Task<bool> SetPrimaryPhotoAsync(int photoId, CancellationToken ct = default)
        {
            var photo = await _photoRepository.GetByIdAsync(photoId, ct);
            if (photo == null || photo.IsDeleted == true)
                throw new KeyNotFoundException("Không tìm thấy ảnh.");

            // Bỏ primary của tất cả ảnh khác của pet này
            var otherPhotos = await _context.PetPhotos
                .Where(p => p.PetId == photo.PetId && p.IsDeleted == false && p.IsPrimary == true)
                .ToListAsync(ct);

            foreach (var p in otherPhotos)
            {
                p.IsPrimary = false;
                p.UpdatedAt = DateTime.Now;
            }

            // Set ảnh này làm primary
            photo.IsPrimary = true;
            photo.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> ReorderPhotosAsync(List<ReorderPhotoRequest> items, CancellationToken ct = default)
        {
            if (items == null || items.Count == 0)
                throw new ArgumentException("Danh sách trống.");

            var ids = items.Select(i => i.PhotoId).ToList();
            var photos = await _context.PetPhotos
                .Where(p => ids.Contains(p.PhotoId) && p.IsDeleted == false)
                .ToListAsync(ct);

            if (photos.Count != ids.Count)
                throw new KeyNotFoundException("Có ảnh không tồn tại.");

            var byId = items.ToDictionary(i => i.PhotoId, i => i.SortOrder);
            foreach (var p in photos)
            {
                p.SortOrder = byId[p.PhotoId];
                p.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> DeletePhotoAsync(int photoId, bool hard = false, CancellationToken ct = default)
        {
            var photo = await _photoRepository.GetByIdAsync(photoId, ct);
            if (photo == null || photo.IsDeleted)
                return false;

            var wasPrimary = photo.IsPrimary == true;
            var petId = photo.PetId;

            photo.IsDeleted = true;
            photo.IsPrimary = false; // Xóa flag primary
            photo.UpdatedAt = DateTime.Now;
            await _photoRepository.UpdateAsync(photo, ct);

            // Primary Photo Rule: Nếu xóa ảnh chính, tự động chọn ảnh khác làm primary
            if (wasPrimary)
            {
                var nextPhoto = await _context.PetPhotos
                    .Where(p => p.PetId == petId && p.IsDeleted == false)
                    .OrderBy(p => p.SortOrder)
                    .FirstOrDefaultAsync(ct);

                if (nextPhoto != null)
                {
                    nextPhoto.IsPrimary = true;
                    nextPhoto.UpdatedAt = DateTime.Now;
                    await _context.SaveChangesAsync(ct);
                }
            }

            if (hard && !string.IsNullOrWhiteSpace(photo.PublicId))
                await _storage.DeleteAsync(photo.PublicId, ct);

            return true;
        }
    }
}




