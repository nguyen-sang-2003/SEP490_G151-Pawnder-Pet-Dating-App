using BE.DTO;
using AttributeEntity = BE.Models.Attribute;

namespace BE.Services.Interfaces
{
    public interface IAttributeService
    {
        Task<PagedResult<AttributeResponse>> GetAttributesAsync(
            string? search,
            int page,
            int pageSize,
            bool includeDeleted,
            CancellationToken ct = default);
        
        Task<AttributeResponse?> GetAttributeByIdAsync(int id, CancellationToken ct = default);
        Task<AttributeResponse> CreateAttributeAsync(AttributeCreateRequest request, CancellationToken ct = default);
        Task<bool> UpdateAttributeAsync(int id, AttributeUpdateRequest request, CancellationToken ct = default);
        Task<bool> DeleteAttributeAsync(int id, bool hard = false, CancellationToken ct = default);
        Task<object> GetAttributesForFilterAsync(CancellationToken ct = default);
    }
}




