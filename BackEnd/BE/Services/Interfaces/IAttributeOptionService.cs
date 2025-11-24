using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IAttributeOptionService
    {
        Task<IEnumerable<OptionResponse>> GetAllOptionsAsync(CancellationToken ct = default);
        Task<IEnumerable<object>> GetOptionsByAttributeIdAsync(int attributeId, CancellationToken ct = default);
        Task<object> CreateOptionAsync(int attributeId, string optionName, CancellationToken ct = default);
        Task<bool> UpdateOptionAsync(int optionId, string optionName, CancellationToken ct = default);
        Task<bool> DeleteOptionAsync(int optionId, CancellationToken ct = default);
    }
}




