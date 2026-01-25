using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories;

public class SubmissionRepository : BaseRepository<EventSubmission>, ISubmissionRepository
{
    public SubmissionRepository(PawnderDatabaseContext context) : base(context)
    {
    }

    public async Task<IEnumerable<EventSubmission>> GetByEventIdAsync(int eventId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(s => s.User)
            .Include(s => s.Pet)
                .ThenInclude(p => p.PetPhotos)
            .Where(s => s.EventId == eventId && s.IsDeleted != true)
            .OrderByDescending(s => s.VoteCount)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<EventSubmission>> GetLeaderboardAsync(int eventId, int top = 10, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(s => s.User)
            .Include(s => s.Pet)
                .ThenInclude(p => p.PetPhotos)
            .Where(s => s.EventId == eventId && s.IsDeleted != true)
            .OrderByDescending(s => s.VoteCount)
            .ThenBy(s => s.CreatedAt) // Tie-breaker: ai đăng trước thắng
            .Take(top)
            .ToListAsync(ct);
    }

    public async Task<bool> HasUserSubmittedAsync(int eventId, int userId, CancellationToken ct = default)
    {
        return await _dbSet
            .AnyAsync(s => s.EventId == eventId && s.UserId == userId && s.IsDeleted != true, ct);
    }

    public async Task<EventSubmission?> GetByIdWithDetailsAsync(int submissionId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(s => s.Event)
            .Include(s => s.User)
            .Include(s => s.Pet)
                .ThenInclude(p => p.PetPhotos)
            .Include(s => s.Votes)
            .FirstOrDefaultAsync(s => s.SubmissionId == submissionId && s.IsDeleted != true, ct);
    }

    public async Task<bool> HasUserVotedAsync(int submissionId, int userId, CancellationToken ct = default)
    {
        return await _context.EventVotes
            .AnyAsync(v => v.SubmissionId == submissionId && v.UserId == userId, ct);
    }

    public async Task AddVoteAsync(int submissionId, int userId, CancellationToken ct = default)
    {
        var vote = new EventVote
        {
            SubmissionId = submissionId,
            UserId = userId,
            CreatedAt = DateTime.Now
        };
        
        await _context.EventVotes.AddAsync(vote, ct);
        await _context.SaveChangesAsync(ct);
        
        // Update vote count
        await UpdateVoteCountAsync(submissionId, ct);
    }

    public async Task RemoveVoteAsync(int submissionId, int userId, CancellationToken ct = default)
    {
        var vote = await _context.EventVotes
            .FirstOrDefaultAsync(v => v.SubmissionId == submissionId && v.UserId == userId, ct);
        
        if (vote != null)
        {
            _context.EventVotes.Remove(vote);
            await _context.SaveChangesAsync(ct);
            
            // Update vote count
            await UpdateVoteCountAsync(submissionId, ct);
        }
    }

    public async Task UpdateVoteCountAsync(int submissionId, CancellationToken ct = default)
    {
        var submission = await _dbSet.FindAsync(new object[] { submissionId }, ct);
        if (submission != null)
        {
            submission.VoteCount = await _context.EventVotes
                .CountAsync(v => v.SubmissionId == submissionId, ct);
            
            await _context.SaveChangesAsync(ct);
        }
    }
}
