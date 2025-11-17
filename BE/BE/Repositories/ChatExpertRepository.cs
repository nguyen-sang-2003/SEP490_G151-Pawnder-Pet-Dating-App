using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class ChatExpertRepository : BaseRepository<ChatExpert>, IChatExpertRepository
    {
        public ChatExpertRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<object>> GetChatsByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(c => c.Expert)
                .Include(c => c.User)
                .Where(c => c.UserId == userId)
                .Select(c => new
                {
                    chatExpertId = c.ChatExpertId,
                    expertId = c.ExpertId,
                    expertName = c.Expert != null ? c.Expert.FullName : null,
                    expertEmail = c.Expert != null ? c.Expert.Email : null,
                    userId = c.UserId,
                    userName = c.User != null ? c.User.FullName : null,
                    userEmail = c.User != null ? c.User.Email : null,
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<object>> GetChatsByExpertIdAsync(int expertId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(c => c.Expert)
                .Include(c => c.User)
                .Where(c => c.ExpertId == expertId)
                .Select(c => new
                {
                    chatExpertId = c.ChatExpertId,
                    expertId = c.ExpertId,
                    expertName = c.Expert != null ? c.Expert.FullName : null,
                    expertEmail = c.Expert != null ? c.Expert.Email : null,
                    userId = c.UserId,
                    userName = c.User != null ? c.User.FullName : null,
                    userEmail = c.User != null ? c.User.Email : null,
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<ChatExpert?> GetChatExpertByExpertAndUserAsync(int expertId, int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(c => c.ExpertId == expertId && c.UserId == userId, ct);
        }

        public async Task<bool> ChatExpertExistsAsync(int chatExpertId, CancellationToken ct = default)
        {
            return await _dbSet
                .AnyAsync(c => c.ChatExpertId == chatExpertId, ct);
        }
    }
}

