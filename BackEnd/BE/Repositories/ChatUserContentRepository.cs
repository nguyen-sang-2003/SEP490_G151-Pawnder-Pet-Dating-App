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
                .Where(c => c.MatchId == matchId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    ContentId = c.ContentId,
                    MatchId = c.MatchId,
                    // Ưu tiên FromUserId (cột mới luôn có), fallback sang FromPet nếu cần
                    FromUserId = c.FromUserId != null 
                        ? c.FromUserId 
                        : (c.FromPet != null ? c.FromPet.UserId : null),
                    // Ưu tiên FromUser (trực tiếp), fallback sang FromPet.User
                    FromUserName = c.FromUser != null 
                        ? c.FromUser.FullName 
                        : (c.FromPet != null && c.FromPet.User != null ? c.FromPet.User.FullName : "Unknown User"),
                    Message = c.Message,
                    CreatedAt = c.CreatedAt
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




