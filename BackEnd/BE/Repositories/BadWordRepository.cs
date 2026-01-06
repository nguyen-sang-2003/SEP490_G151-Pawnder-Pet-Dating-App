using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class BadWordRepository : BaseRepository<BadWord>, IBadWordRepository
    {
        public BadWordRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<BadWord>> GetActiveBadWordsAsync(CancellationToken ct = default)
        {
            return await _dbSet
                .Where(bw => bw.IsActive == true)
                .OrderBy(bw => bw.Level)
                .ThenBy(bw => bw.Category)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<BadWord>> GetBadWordsByLevelAsync(int level, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(bw => bw.IsActive == true && bw.Level == level)
                .ToListAsync(ct);
        }
    }
}

