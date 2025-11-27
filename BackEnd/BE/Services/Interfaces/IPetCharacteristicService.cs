using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IPetCharacteristicService
    {
        Task<IEnumerable<object>> GetPetCharacteristicsAsync(int petId, CancellationToken ct = default);
        Task<object> CreatePetCharacteristicAsync(int petId, int attributeId, PetCharacteristicDTO dto, CancellationToken ct = default);
        Task<object> UpdatePetCharacteristicAsync(int petId, int attributeId, PetCharacteristicDTO dto, CancellationToken ct = default);
    }
}




