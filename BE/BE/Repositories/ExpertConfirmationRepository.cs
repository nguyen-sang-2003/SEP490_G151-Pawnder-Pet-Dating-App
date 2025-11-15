using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class ExpertConfirmationRepository : BaseRepository<ExpertConfirmation>, IExpertConfirmationRepository
    {
        public ExpertConfirmationRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ExpertConfirmationDTO>> GetAllExpertConfirmationsAsync(CancellationToken ct = default)
        {
            return await _dbSet
                .Include(ec => ec.User)
                .Include(ec => ec.Expert)
                .Include(ec => ec.ChatAi)
                .Select(ec => new ExpertConfirmationDTO
                {
                    UserId = ec.UserId,
                    ChatAiId = ec.ChatAiid,
                    ExpertId = ec.ExpertId,
                    Status = ec.Status,
                    Message = ec.Message,
                    UserQuestion = ec.UserQuestion,
                    CreatedAt = ec.CreatedAt,
                    UpdatedAt = ec.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<ExpertConfirmation?> GetExpertConfirmationAsync(int expertId, int userId, int chatId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(ec => ec.User)
                .Include(ec => ec.Expert)
                .Include(ec => ec.ChatAi)
                .FirstOrDefaultAsync(ec => ec.ExpertId == expertId && ec.UserId == userId && ec.ChatAiid == chatId, ct);
        }

        public async Task<IEnumerable<ExpertConfirmationDTO>> GetUserExpertConfirmationsAsync(int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(ec => ec.UserId == userId)
                .Include(ec => ec.Expert)
                .Include(ec => ec.ChatAi)
                .Select(ec => new ExpertConfirmationDTO
                {
                    UserId = ec.UserId,
                    ChatAiId = ec.ChatAiid,
                    ExpertId = ec.ExpertId,
                    Status = ec.Status,
                    Message = ec.Message,
                    UserQuestion = ec.UserQuestion,
                    CreatedAt = ec.CreatedAt,
                    UpdatedAt = ec.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<ExpertConfirmation?> GetExpertConfirmationByUserAndChatAsync(int userId, int chatId, CancellationToken ct = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(ec => ec.UserId == userId && ec.ChatAiid == chatId, ct);
        }
    }
}




