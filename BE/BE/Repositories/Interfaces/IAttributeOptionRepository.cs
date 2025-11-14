using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IAttributeOptionRepository : IBaseRepository<AttributeOption>
    {
        Task<IEnumerable<OptionResponse>> GetAllOptionsAsync(CancellationToken ct = default);
        Task<IEnumerable<object>> GetOptionsByAttributeIdAsync(int attributeId, CancellationToken ct = default);
    }
}




