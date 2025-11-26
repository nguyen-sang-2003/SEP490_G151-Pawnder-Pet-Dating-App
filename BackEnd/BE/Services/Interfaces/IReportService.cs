using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IReportService
    {
        Task<IEnumerable<ReportDto>> GetAllReportsAsync(CancellationToken ct = default);
        Task<ReportDto?> GetReportByIdAsync(int reportId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetReportsByUserIdAsync(int userReportId, CancellationToken ct = default);
        Task<object> CreateReportAsync(int userReportId, int contentId, ReportCreateDTO dto, CancellationToken ct = default);
        Task<ReportDto> UpdateReportAsync(int reportId, ReportUpdateDTO dto, CancellationToken ct = default);
    }
}




