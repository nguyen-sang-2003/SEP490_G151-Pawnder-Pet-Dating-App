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
        private const int MaxPhotosPerPet = 6;

        public PetPhotoService(
            IPetPhotoRepository photoRepository,
            PawnderDatabaseContext context,
            IPhotoStorage storage)
        {
            _photoRepository = photoRepository;
            _context = context;
            _storage = storage;
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

            var pet = await _context.Pets.FindAsync([petId], ct);
            if (pet == null || pet.IsDeleted == true)
                throw new KeyNotFoundException("Không tìm thấy pet.");

            var existingCount = await _photoRepository.GetPhotoCountByPetIdAsync(petId, ct);
            if (existingCount + files.Count > MaxPhotosPerPet)
                throw new InvalidOperationException($"Tối đa {MaxPhotosPerPet} ảnh cho mỗi pet.");

            var saved = new List<PetPhotoResponse>();

            foreach (var file in files)
            {
                var (url, publicId) = await _storage.UploadAsync(petId, file, ct);
                var maxSort = await _photoRepository.GetMaxSortOrderAsync(petId, ct) ?? -1;

                var photo = new PetPhoto
                {
                    PetId = petId,
                    ImageUrl = url,
                    PublicId = publicId,
                    IsPrimary = false,
                    SortOrder = maxSort + 1,
                    IsDeleted = false,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                await _photoRepository.AddAsync(photo, ct);

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

            photo.IsDeleted = true;
            photo.UpdatedAt = DateTime.Now;
            await _photoRepository.UpdateAsync(photo, ct);

            if (hard && !string.IsNullOrWhiteSpace(photo.PublicId))
                await _storage.DeleteAsync(photo.PublicId, ct);

            return true;
        }
    }
}




