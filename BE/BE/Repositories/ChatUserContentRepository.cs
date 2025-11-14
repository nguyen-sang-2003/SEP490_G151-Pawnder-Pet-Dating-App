using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class ChatUserContentRepository : BaseRepository<ChatUserContent>, IChatUserContentRepository
    {
        public ChatUserContentRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<object>> GetChatMessagesAsync(int matchId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(c => c.FromPet)
                .Where(c => c.MatchId == matchId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.ContentId,
                    c.MatchId,
                    c.FromPetId,
                    FromPetName = c.FromPet != null ? c.FromPet.Name : null,
                    c.Message,
                    c.CreatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<bool> ChatExistsAsync(int matchId, CancellationToken ct = default)
        {
            return await _context.ChatUsers
                .AnyAsync(c => c.MatchId == matchId && c.Status == "Accepted" && c.IsDeleted == false, ct);
        }
    }
}




