using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IBadWordRepository : IBaseRepository<BadWord>
    {
        Task<IEnumerable<BadWord>> GetActiveBadWordsAsync(CancellationToken ct = default);
        Task<IEnumerable<BadWord>> GetBadWordsByLevelAsync(int level, CancellationToken ct = default);
    }
}

