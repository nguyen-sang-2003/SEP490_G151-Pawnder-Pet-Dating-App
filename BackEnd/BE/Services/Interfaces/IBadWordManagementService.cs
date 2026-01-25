using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IBadWordManagementService
    {
        Task<IEnumerable<BadWordDto>> GetAllBadWordsAsync(CancellationToken ct = default);
        Task<BadWordDto?> GetBadWordByIdAsync(int badWordId, CancellationToken ct = default);
        Task<BadWordDto> CreateBadWordAsync(CreateBadWordRequest request, CancellationToken ct = default);
        Task<BadWordDto> UpdateBadWordAsync(int badWordId, UpdateBadWordRequest request, CancellationToken ct = default);
        Task<bool> DeleteBadWordAsync(int badWordId, CancellationToken ct = default);
        Task ReloadCacheAsync(CancellationToken ct = default);
    }
}

