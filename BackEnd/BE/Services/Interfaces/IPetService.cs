using BE.DTO;

namespace BE.Services.Interfaces
{
    /// <summary>
    /// Service interface cho Pet - xử lý business logic
    /// </summary>
    public interface IPetService
    {
        Task<IEnumerable<PetDto>> GetPetsByUserIdAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetPetsForMatchingAsync(int userId, CancellationToken ct = default);
        Task<object?> GetPetByIdAsync(int petId, CancellationToken ct = default);
        Task<object> CreatePetAsync(PetDto_2 petDto, CancellationToken ct = default);
        Task<object> UpdatePetAsync(int petId, PetDto_2 updatedPet, CancellationToken ct = default);
        Task<bool> DeletePetAsync(int petId, CancellationToken ct = default);
        Task<bool> SetActivePetAsync(int petId, CancellationToken ct = default);
    }
}




