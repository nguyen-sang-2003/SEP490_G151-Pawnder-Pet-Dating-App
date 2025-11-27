using BE.DTO;
using BE.Models;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Repositories.Interfaces
{
    public interface IAttributeRepository : IBaseRepository<AttributeEntity>
    {
        Task<PagedResult<AttributeResponse>> GetAttributesAsync(
            string? search,
            int page,
            int pageSize,
            bool includeDeleted,
            CancellationToken ct = default);
        
        Task<AttributeEntity?> GetAttributeByIdAsync(int id, CancellationToken ct = default);
        Task<bool> NameExistsAsync(string name, int? excludeId = null, CancellationToken ct = default);
        Task<IEnumerable<object>> GetAttributesForFilterAsync(CancellationToken ct = default);
    }
}




