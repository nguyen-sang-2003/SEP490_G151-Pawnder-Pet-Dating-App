using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class ReportRepository : BaseRepository<Report>, IReportRepository
    {
        public ReportRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ReportDto>> GetAllReportsAsync(CancellationToken ct = default)
        {
            return await _dbSet
                .Include(r => r.UserReport)
                .Include(r => r.Content!)
                    .ThenInclude(c => c.FromUser)
                .Include(r => r.Content!)
                    .ThenInclude(c => c.FromPet!)
                        .ThenInclude(p => p.User)
                .Select(r => new ReportDto
                {
                    ReportId = r.ReportId,
                    Reason = r.Reason,
                    Status = r.Status,
                    Resolution = r.Resolution,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    ContentId = r.ContentId,
                    Content = r.Content != null ? new ContentDto
                    {
                        ContentId = r.Content.ContentId,
                        Message = r.Content.Message,
                        CreatedAt = r.Content.CreatedAt
                    } : null,
                    UserReport = r.UserReport != null ? new UserReportDto
                    {
                        UserId = r.UserReport.UserId,
                        FullName = r.UserReport.FullName,
                        Email = r.UserReport.Email
                    } : null,
                    // Người bị báo cáo: ưu tiên FromUser, fallback FromPet.User
                    ReportedUser = r.Content != null
                        ? (r.Content.FromUser != null
                            ? new UserReportDto
                            {
                                UserId = r.Content.FromUser.UserId,
                                FullName = r.Content.FromUser.FullName,
                                Email = r.Content.FromUser.Email
                            }
                            : (r.Content.FromPet != null && r.Content.FromPet.User != null
                                ? new UserReportDto
                                {
                                    UserId = r.Content.FromPet.User.UserId,
                                    FullName = r.Content.FromPet.User.FullName,
                                    Email = r.Content.FromPet.User.Email
                                }
                                : null))
                        : null
                })
                .ToListAsync(ct);
        }

        public async Task<ReportDto?> GetReportByIdAsync(int reportId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(r => r.UserReport)
                .Include(r => r.Content!)
                    .ThenInclude(c => c.FromUser)
                .Include(r => r.Content!)
                    .ThenInclude(c => c.FromPet!)
                        .ThenInclude(p => p.User)
                .Where(r => r.ReportId == reportId)
                .Select(r => new ReportDto
                {
                    ReportId = r.ReportId,
                    Reason = r.Reason,
                    Status = r.Status,
                    Resolution = r.Resolution,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    UserReport = r.UserReport != null ? new UserReportDto
                    {
                        UserId = r.UserReport.UserId,
                        FullName = r.UserReport.FullName,
                        Email = r.UserReport.Email
                    } : null,
                    ReportedUser = r.Content != null
                        ? (r.Content.FromUser != null
                            ? new UserReportDto
                            {
                                UserId = r.Content.FromUser.UserId,
                                FullName = r.Content.FromUser.FullName,
                                Email = r.Content.FromUser.Email
                            }
                            : (r.Content.FromPet != null && r.Content.FromPet.User != null
                                ? new UserReportDto
                                {
                                    UserId = r.Content.FromPet.User.UserId,
                                    FullName = r.Content.FromPet.User.FullName,
                                    Email = r.Content.FromPet.User.Email
                                }
                                : null))
                        : null
                })
                .FirstOrDefaultAsync(ct);
        }

        public async Task<IEnumerable<object>> GetReportsByUserIdAsync(int userReportId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(r => r.UserReport)
                .Include(r => r.Content!)
                    .ThenInclude(c => c.FromPet!)
                        .ThenInclude(p => p.User!)
                .Where(r => r.UserReportId == userReportId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.ReportId,
                    r.Reason,
                    r.Status,
                    r.Resolution,
                    r.CreatedAt,
                    r.UpdatedAt,
                    r.ContentId,
                    UserReport = r.UserReport != null ? new
                    {
                        r.UserReport.UserId,
                        r.UserReport.FullName,
                        r.UserReport.Email
                    } : null,
                    Content = r.Content != null ? new
                    {
                        r.Content.ContentId,
                        r.Content.Message,
                        r.Content.CreatedAt
                    } : null,
                    ReportedUser = r.Content != null && r.Content.FromPet != null && r.Content.FromPet.User != null ? new
                    {
                        r.Content.FromPet.User.UserId,
                        r.Content.FromPet.User.FullName,
                        r.Content.FromPet.User.Email
                    } : null
                })
                .ToListAsync(ct);
        }
    }
}




