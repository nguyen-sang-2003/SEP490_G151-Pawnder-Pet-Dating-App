using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class PetCharacteristicRepository : BaseRepository<PetCharacteristic>, IPetCharacteristicRepository
    {
        public PetCharacteristicRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<object>> GetPetCharacteristicsAsync(int petId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(pc => pc.Attribute)
                .Include(pc => pc.Option)
                .Where(pc => pc.PetId == petId)
                .Select(pc => new
                {
                    attributeId = pc.AttributeId,
                    name = pc.Attribute.Name,
                    optionValue = pc.Option != null ? pc.Option.Name : null,
                    value = pc.Value,
                    unit = pc.Attribute.Unit,
                    typeValue = pc.Attribute.TypeValue,
                })
                .ToListAsync(ct);
        }

        public async Task<PetCharacteristic?> GetPetCharacteristicAsync(int petId, int attributeId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(pc => pc.Attribute)
                .Include(pc => pc.Option)
                .FirstOrDefaultAsync(pc => pc.PetId == petId && pc.AttributeId == attributeId, ct);
        }

        public async Task<bool> ExistsAsync(int petId, int attributeId, CancellationToken ct = default)
        {
            return await _dbSet
                .AnyAsync(pc => pc.PetId == petId && pc.AttributeId == attributeId, ct);
        }
    }
}




