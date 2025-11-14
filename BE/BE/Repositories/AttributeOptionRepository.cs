using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class AttributeOptionRepository : BaseRepository<AttributeOption>, IAttributeOptionRepository
    {
        public AttributeOptionRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<OptionResponse>> GetAllOptionsAsync(CancellationToken ct = default)
        {
            return await _dbSet
                .Where(o => o.IsDeleted == false)
                .Select(o => new OptionResponse
                {
                    OptionId = o.OptionId,
                    AttributeId = o.AttributeId,
                    Name = o.Name,
                    IsDeleted = o.IsDeleted
                })
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<object>> GetOptionsByAttributeIdAsync(int attributeId, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(o => o.AttributeId == attributeId && o.IsDeleted == false)
                .Select(o => new
                {
                    OptionId = o.OptionId,
                    Name = o.Name,
                    AttributeId = o.AttributeId
                })
                .ToListAsync(ct);
        }
    }
}




