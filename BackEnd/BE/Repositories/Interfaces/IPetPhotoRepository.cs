using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IPetPhotoRepository : IBaseRepository<PetPhoto>
    {
        Task<IEnumerable<PetPhotoResponse>> GetPhotosByPetIdAsync(int petId, CancellationToken ct = default);
        Task<int> GetPhotoCountByPetIdAsync(int petId, CancellationToken ct = default);
        Task<int?> GetMaxSortOrderAsync(int petId, CancellationToken ct = default);
    }
}




