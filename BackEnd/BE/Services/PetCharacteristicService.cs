using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class PetCharacteristicService : IPetCharacteristicService
    {
        private readonly IPetCharacteristicRepository _petCharacteristicRepository;
        private readonly PawnderDatabaseContext _context;

        public PetCharacteristicService(
            IPetCharacteristicRepository petCharacteristicRepository,
            PawnderDatabaseContext context)
        {
            _petCharacteristicRepository = petCharacteristicRepository;
            _context = context;
        }

        public async Task<IEnumerable<object>> GetPetCharacteristicsAsync(int petId, CancellationToken ct = default)
        {
            return await _petCharacteristicRepository.GetPetCharacteristicsAsync(petId, ct);
        }

        public async Task<object> CreatePetCharacteristicAsync(int petId, int attributeId, PetCharacteristicDTO dto, CancellationToken ct = default)
        {
            // Business logic: Validate pet
            var pet = await _context.Pets.FindAsync([petId], ct);
            if (pet == null || pet.IsDeleted == true)
                throw new KeyNotFoundException("Pet không tồn tại.");

            // Business logic: Validate attribute
            var attribute = await _context.Attributes
                .Include(a => a.AttributeOptions)
                .FirstOrDefaultAsync(a => a.AttributeId == attributeId, ct);
            if (attribute == null || attribute.IsDeleted == true)
                throw new KeyNotFoundException("Attribute không tồn tại.");

            // Business logic: Check duplicate
            var exists = await _petCharacteristicRepository.ExistsAsync(petId, attributeId, ct);
            if (exists)
                throw new InvalidOperationException("Đặc điểm này đã tồn tại cho pet.");

            var petChar = new PetCharacteristic
            {
                PetId = petId,
                AttributeId = attributeId,
                OptionId = dto.OptionId.HasValue && dto.OptionId.Value > 0 ? dto.OptionId : null,
                Value = dto.Value.HasValue && dto.Value.Value > 0 ? (int?)Convert.ToInt32(dto.Value.Value) : null,
                UpdatedAt = DateTime.Now,
                CreatedAt = DateTime.Now
            };

            await _petCharacteristicRepository.AddAsync(petChar, ct);

            return new
            {
                attributeId = attribute.AttributeId,
                name = attribute.Name,
                typeValue = attribute.TypeValue,
                unit = attribute.Unit,
                value = petChar.Value,
                optionValue = petChar.OptionId != null
                    ? attribute.AttributeOptions.FirstOrDefault(o => o.OptionId == petChar.OptionId)?.Name
                    : null
            };
        }

        public async Task<object> UpdatePetCharacteristicAsync(int petId, int attributeId, PetCharacteristicDTO dto, CancellationToken ct = default)
        {
            var petChar = await _petCharacteristicRepository.GetPetCharacteristicAsync(petId, attributeId, ct);
            if (petChar == null)
                throw new KeyNotFoundException("Đặc điểm này chưa tồn tại cho pet.");

            // Business logic: Update value
            if (dto.Value.HasValue && dto.Value.Value != 0)
                petChar.Value = (int?)Convert.ToInt32(dto.Value.Value);
            else
                petChar.Value = null;

            // Business logic: Update option
            string? optionValueString = null;
            if (dto.OptionId.HasValue && dto.OptionId.Value != 0)
            {
                var exitOptionAttribute = await _context.AttributeOptions
                    .FirstOrDefaultAsync(op => op.OptionId == dto.OptionId.Value && op.IsDeleted == false, ct);
                if (exitOptionAttribute == null)
                    throw new KeyNotFoundException("Option không tồn tại hoặc đã bị xóa.");

                optionValueString = exitOptionAttribute.Name;
                petChar.OptionId = dto.OptionId.Value;
            }
            else
                petChar.OptionId = null;

            petChar.UpdatedAt = DateTime.Now;
            await _petCharacteristicRepository.UpdateAsync(petChar, ct);

            return new
            {
                attributeId = petChar.AttributeId,
                name = petChar.Attribute.Name,
                optionValue = petChar.OptionId != null ? optionValueString : null,
                value = petChar.Value,
                unit = petChar.Attribute.Unit,
                typeValue = petChar.Attribute.TypeValue,
            };
        }
    }
}




