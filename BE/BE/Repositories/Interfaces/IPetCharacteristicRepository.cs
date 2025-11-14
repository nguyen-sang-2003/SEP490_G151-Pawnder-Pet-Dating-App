using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IPetCharacteristicRepository : IBaseRepository<PetCharacteristic>
    {
        Task<IEnumerable<object>> GetPetCharacteristicsAsync(int petId, CancellationToken ct = default);
        Task<PetCharacteristic?> GetPetCharacteristicAsync(int petId, int attributeId, CancellationToken ct = default);
        Task<bool> ExistsAsync(int petId, int attributeId, CancellationToken ct = default);
    }
}




