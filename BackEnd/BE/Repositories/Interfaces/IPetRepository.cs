using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    /// <summary>
    /// Repository interface cho Pet - chỉ chứa các query DB
    /// </summary>
    public interface IPetRepository : IBaseRepository<Pet>
    {
        /// <summary>
        /// </summary>
        /// <returns>IQueryable of valid pets</returns>
        IQueryable<Pet> GetValidPetsQuery();

        Task<IEnumerable<PetDto>> GetPetsByUserIdAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetPetsForMatchingAsync(int userId, List<int> excludedUserIds, List<int> blockedUserIds, CancellationToken ct = default);
        Task<Pet?> GetPetByIdWithDetailsAsync(int petId, CancellationToken ct = default);
        Task<bool> IsPetOwnerAsync(int petId, int userId, CancellationToken ct = default);
        Task DeactivateOtherPetsAsync(int userId, int activePetId, CancellationToken ct = default);
    }
}




