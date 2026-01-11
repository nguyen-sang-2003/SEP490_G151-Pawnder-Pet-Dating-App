using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories;

public class EventRepository : BaseRepository<PetEvent>, IEventRepository
{
    public EventRepository(PawnderDatabaseContext context) : base(context)
    {
    }

    public async Task<IEnumerable<PetEvent>> GetAllEventsAsync(CancellationToken ct = default)
    {
        return await _dbSet
            .Include(e => e.CreatedByUser)
            .Include(e => e.Submissions.Where(s => s.IsDeleted != true))
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<PetEvent>> GetActiveEventsAsync(CancellationToken ct = default)
    {
        // Lấy tất cả events trừ cancelled để user có thể xem lại cuộc thi đã tham gia
        return await _dbSet
            .Include(e => e.CreatedByUser)
            .Include(e => e.Submissions.Where(s => s.IsDeleted != true))
            .Where(e => e.Status != "cancelled")
            .OrderByDescending(e => e.Status == "active" || e.Status == "submission_closed" ? 1 : 0) // Ưu tiên đang diễn ra
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<PetEvent?> GetEventWithSubmissionsAsync(int eventId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(e => e.CreatedByUser)
            .Include(e => e.Submissions.Where(s => s.IsDeleted != true))
                .ThenInclude(s => s.User)
            .Include(e => e.Submissions.Where(s => s.IsDeleted != true))
                .ThenInclude(s => s.Pet)
                    .ThenInclude(p => p.PetPhotos)
            .Include(e => e.Submissions.Where(s => s.IsDeleted != true))
                .ThenInclude(s => s.Votes)
            .FirstOrDefaultAsync(e => e.EventId == eventId, ct);
    }

    public async Task<IEnumerable<PetEvent>> GetEventsToTransitionAsync(CancellationToken ct = default)
    {
        var now = DateTime.Now;
        
        // Lấy events cần chuyển trạng thái:
        // 1. upcoming -> active (StartTime đã đến)
        // 2. active -> submission_closed (SubmissionDeadline đã qua)
        // 3. submission_closed -> voting_ended (EndTime đã qua)
        return await _dbSet
            .Where(e => 
                (e.Status == "upcoming" && e.StartTime <= now) ||
                (e.Status == "active" && e.SubmissionDeadline <= now) ||
                (e.Status == "submission_closed" && e.EndTime <= now))
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<PetEvent>> GetEventsByStatusAsync(string status, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(e => e.CreatedByUser)
            .Where(e => e.Status == status)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(ct);
    }
}
