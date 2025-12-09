using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class PaymentHistoryRepository : BaseRepository<PaymentHistory>, IPaymentHistoryRepository
    {
        public PaymentHistoryRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<object>> GetPaymentHistoriesByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(ph => ph.UserId == userId)
                .OrderByDescending(ph => ph.CreatedAt)
                .Select(ph => new
                {
                    historyId = ph.HistoryId,
                    userId = ph.UserId,
                    statusService = ph.StatusService,
                    amount = ph.Amount,
                    startDate = ph.StartDate,
                    endDate = ph.EndDate,
                    createdAt = ph.CreatedAt,
                    updatedAt = ph.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<object>> GetAllPaymentHistoriesAsync(CancellationToken ct = default)
        {
            return await _dbSet
                .Include(ph => ph.User)
                .OrderByDescending(ph => ph.CreatedAt)
                .Select(ph => new
                {
                    historyId = ph.HistoryId,
                    userId = ph.UserId,
                    userName = ph.User != null ? ph.User.FullName : null,
                    userEmail = ph.User != null ? ph.User.Email : null,
                    statusService = ph.StatusService,
                    amount = ph.Amount,
                    startDate = ph.StartDate,
                    endDate = ph.EndDate,
                    createdAt = ph.CreatedAt,
                    updatedAt = ph.UpdatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<object?> GetVipStatusAsync(int userId, CancellationToken ct = default)
        {
            var today = DateOnly.FromDateTime(DateTime.Now);

            return await _dbSet
                .Where(ph => ph.UserId == userId
                    && ph.StatusService != null
                    && ph.StatusService.ToLower().Contains("active")
                    && ph.StartDate <= today
                    && ph.EndDate >= today)
                .OrderByDescending(ph => ph.EndDate)
                .Select(ph => new
                {
                    historyId = ph.HistoryId,
                    statusService = ph.StatusService,
                    startDate = ph.StartDate,
                    endDate = ph.EndDate,
                    daysRemaining = ph.EndDate.HasValue
                        ? ph.EndDate.Value.DayNumber - today.DayNumber
                        : 0
                })
                .FirstOrDefaultAsync(ct);
        }
    }
}




