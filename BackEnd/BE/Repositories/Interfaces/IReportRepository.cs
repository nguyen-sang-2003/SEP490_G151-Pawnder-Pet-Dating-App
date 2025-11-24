using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IReportRepository : IBaseRepository<Report>
    {
        Task<IEnumerable<ReportDto>> GetAllReportsAsync(CancellationToken ct = default);
        Task<ReportDto?> GetReportByIdAsync(int reportId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetReportsByUserIdAsync(int userReportId, CancellationToken ct = default);
    }
}




