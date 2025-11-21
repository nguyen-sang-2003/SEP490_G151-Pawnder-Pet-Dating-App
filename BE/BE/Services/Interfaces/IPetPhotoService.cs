using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IPetPhotoService
    {
        Task<IEnumerable<PetPhotoResponse>> GetPhotosByPetIdAsync(int petId, CancellationToken ct = default);
        Task<IEnumerable<PetPhotoResponse>> UploadPhotosAsync(int petId, List<IFormFile> files, CancellationToken ct = default);
        Task<bool> ReorderPhotosAsync(List<ReorderPhotoRequest> items, CancellationToken ct = default);
        Task<bool> DeletePhotoAsync(int photoId, bool hard = false, CancellationToken ct = default);
    }
}




