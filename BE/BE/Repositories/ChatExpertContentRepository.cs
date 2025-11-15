using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class ChatExpertContentRepository : BaseRepository<ChatExpertContent>, IChatExpertContentRepository
    {
        public ChatExpertContentRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<object>> GetChatMessagesAsync(int chatExpertId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(c => c.From)
                .Include(c => c.ExpertConfirmation)
                .Where(c => c.ChatExpertId == chatExpertId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    contentId = c.ContentId,
                    chatExpertId = c.ChatExpertId,
                    fromId = c.FromId,
                    fromName = c.From != null ? c.From.FullName : null,
                    fromEmail = c.From != null ? c.From.Email : null,
                    message = c.Message,
                    expertId = c.ExpertId,
                    userId = c.UserId,
                    chatAiid = c.ChatAiid,
                    expertConfirmation = c.ExpertConfirmation != null ? new
                    {
                        status = c.ExpertConfirmation.Status,
                        message = c.ExpertConfirmation.Message,
                        userQuestion = c.ExpertConfirmation.UserQuestion
                    } : null,
                    createdAt = c.CreatedAt,
                    updatedAt = c.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<bool> ChatExpertExistsAsync(int chatExpertId, CancellationToken ct = default)
        {
            return await _context.ChatExperts
                .AnyAsync(c => c.ChatExpertId == chatExpertId, ct);
        }
    }
}

