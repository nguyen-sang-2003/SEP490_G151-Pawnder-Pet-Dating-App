using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Repositories
{
    public class AttributeRepository : BaseRepository<AttributeEntity>, IAttributeRepository
    {
        public AttributeRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<PagedResult<AttributeResponse>> GetAttributesAsync(
            string? search,
            int page,
            int pageSize,
            bool includeDeleted,
            CancellationToken ct = default)
        {
            IQueryable<AttributeEntity> q = _dbSet.AsNoTracking();

            if (!includeDeleted)
                q = q.Where(a => a.IsDeleted == false);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var keyword = search.Trim();
                q = q.Where(a =>
                    a.Name.Contains(keyword) ||
                    (a.TypeValue != null && a.TypeValue.Contains(keyword)) ||
                    (a.Unit != null && a.Unit.Contains(keyword)));
            }

            var total = await q.CountAsync(ct);
            var items = await q
                .OrderBy(a => a.AttributeId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AttributeResponse
                {
                    AttributeId = a.AttributeId,
                    Name = a.Name,
                    TypeValue = a.TypeValue,
                    Unit = a.Unit,
                    IsDeleted = a.IsDeleted,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt,
                    optionRespones = a.AttributeOptions
                        .Where(o => includeDeleted || o.IsDeleted == false)
                        .Select(o => new OptionRespone
                        {
                            OptionId = o.OptionId,
                            AttributeId = o.AttributeId,
                            Name = o.Name,
                            IsDeleted = o.IsDeleted
                        }).ToList()
                })
                .ToListAsync(ct);

            return new PagedResult<AttributeResponse>(items, total, page, pageSize);
        }

        public async Task<AttributeEntity?> GetAttributeByIdAsync(int id, CancellationToken ct = default)
        {
            return await _dbSet.AsNoTracking()
                .FirstOrDefaultAsync(a => a.AttributeId == id, ct);
        }

        public async Task<bool> NameExistsAsync(string name, int? excludeId = null, CancellationToken ct = default)
        {
            var query = _dbSet.Where(a => a.IsDeleted == false && a.Name.ToLower() == name.ToLower());
            
            if (excludeId.HasValue)
                query = query.Where(a => a.AttributeId != excludeId.Value);
            
            return await query.AnyAsync(ct);
        }

        public async Task<IEnumerable<object>> GetAttributesForFilterAsync(CancellationToken ct = default)
        {
            return await _dbSet
                .AsNoTracking()
                .Where(a => a.IsDeleted == false)
                .Include(a => a.AttributeOptions.Where(o => o.IsDeleted == false))
                .OrderBy(a => a.AttributeId)
                .Select(a => new
                {
                    AttributeId = a.AttributeId,
                    Name = a.Name,
                    TypeValue = a.TypeValue,
                    Unit = a.Unit,
                    Percent = a.Percent,
                    Options = a.AttributeOptions
                        .Where(o => o.IsDeleted == false)
                        .Select(o => new
                        {
                            OptionId = o.OptionId,
                            Name = o.Name
                        })
                        .ToList()
                })
                .ToListAsync(ct);
        }
    }
}




