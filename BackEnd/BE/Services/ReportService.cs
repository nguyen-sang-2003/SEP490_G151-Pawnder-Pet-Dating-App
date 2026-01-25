using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly INotificationService _notificationService;

        public ReportService(
            IReportRepository reportRepository,
            PawnderDatabaseContext context,
            INotificationService notificationService)
        {
            _reportRepository = reportRepository;
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<ReportDto>> GetAllReportsAsync(CancellationToken ct = default)
        {
            return await _reportRepository.GetAllReportsAsync(ct);
        }

        public async Task<ReportDto?> GetReportByIdAsync(int reportId, CancellationToken ct = default)
        {
            return await _reportRepository.GetReportByIdAsync(reportId, ct);
        }

        public async Task<IEnumerable<object>> GetReportsByUserIdAsync(int userReportId, CancellationToken ct = default)
        {
            return await _reportRepository.GetReportsByUserIdAsync(userReportId, ct);
        }

        public async Task<object> CreateReportAsync(int userReportId, int contentId, ReportCreateDTO dto, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
                throw new ArgumentException("Reason is required.");

            // Business logic: Validate user
            var user = await _context.Users.FindAsync([userReportId], ct);
            if (user == null)
                throw new KeyNotFoundException($"User with ID {userReportId} not found.");

            // Business logic: Validate content
            var content = await _context.ChatUserContents
                .Include(c => c.FromPet)
                .FirstOrDefaultAsync(c => c.ContentId == contentId, ct);
            if (content == null)
                throw new KeyNotFoundException($"Content with ID {contentId} not found.");

            // Business logic: Get reported user from pet
            if (content.FromPet == null || content.FromPet.UserId == null)
                throw new InvalidOperationException("Invalid message sender.");

            int reportedUserId = content.FromPet.UserId.Value;

            if (userReportId == reportedUserId)
                throw new InvalidOperationException("Cannot report yourself.");

            // Business logic: Create report
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var report = new Report
            {
                UserReportId = userReportId,
                ContentId = contentId,
                Reason = dto.Reason,
                Status = "Pending",
                CreatedAt = now,
                UpdatedAt = now
            };

            await _reportRepository.AddAsync(report, ct);

            // Business logic: AUTO BLOCK - Check if user is already blocked
            var existingBlock = await _context.Blocks
                .FirstOrDefaultAsync(b => b.FromUserId == userReportId && b.ToUserId == reportedUserId, ct);

            if (existingBlock == null)
            {
                var block = new Block
                {
                    FromUserId = userReportId,
                    ToUserId = reportedUserId,
                    CreatedAt = now
                };
                _context.Blocks.Add(block);
            }

            // Business logic: SOFT DELETE CHAT
            var existingChat = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .FirstOrDefaultAsync(c =>
                    c.IsDeleted == false &&
                    c.FromPet != null && c.ToPet != null &&
                    ((c.FromPet.UserId == userReportId && c.ToPet.UserId == reportedUserId) ||
                    (c.FromPet.UserId == reportedUserId && c.ToPet.UserId == userReportId)), ct);

            if (existingChat != null)
            {
                existingChat.IsDeleted = true;
                existingChat.UpdatedAt = now;
                _context.Entry(existingChat).State = EntityState.Modified;
            }

            // Business logic: AUTO CANCEL APPOINTMENTS between reporter and reported user
            var appointmentsToCancel = await _context.Set<PetAppointment>()
                .Where(a => 
                    (a.Status == "pending" || a.Status == "confirmed") &&
                    ((a.InviterUserId == userReportId && a.InviteeUserId == reportedUserId) ||
                     (a.InviterUserId == reportedUserId && a.InviteeUserId == userReportId)))
                .ToListAsync(ct);

            foreach (var appointment in appointmentsToCancel)
            {
                appointment.Status = "cancelled";
                appointment.CancelledBy = userReportId;
                appointment.CancelReason = "Tự động hủy do báo cáo vi phạm";
                appointment.UpdatedAt = now;
            }

            await _context.SaveChangesAsync(ct);

            var reportDto = new ReportDto
            {
                ReportId = report.ReportId,
                Reason = report.Reason,
                Status = report.Status,
                Resolution = report.Resolution,
                CreatedAt = report.CreatedAt,
                UpdatedAt = report.UpdatedAt,
                UserReport = new UserReportDto
                {
                    UserId = user.UserId,
                    FullName = user.FullName,
                    Email = user.Email
                }
            };

            return new
            {
                success = true,
                message = "Đã báo cáo tin nhắn, chặn người dùng và ẩn cuộc trò chuyện thành công.",
                data = reportDto
            };
        }

        public async Task<ReportDto> UpdateReportAsync(int reportId, ReportUpdateDTO dto, CancellationToken ct = default)
        {
            var report = await _reportRepository.GetByIdAsync(reportId, ct);
            if (report == null)
                throw new KeyNotFoundException($"Report with ID {reportId} not found.");

            // Business logic: Update status and resolution
            if (!string.IsNullOrWhiteSpace(dto.Status))
                report.Status = dto.Status;

            if (!string.IsNullOrWhiteSpace(dto.Resolution))
                report.Resolution = dto.Resolution;

            report.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            await _reportRepository.UpdateAsync(report, ct);

            // Get updated report with includes (bao gồm thông tin user gửi báo cáo)
            var updatedReport = await _reportRepository.GetReportByIdAsync(reportId, ct);
            if (updatedReport == null)
                throw new KeyNotFoundException($"Report with ID {reportId} not found after update.");

            // Sau khi admin xử lý/từ chối, gửi thông báo cho người dùng đã gửi báo cáo
            try
            {
                if (updatedReport.UserReport != null)
                {
                    var userId = updatedReport.UserReport.UserId;
                    var normalizedStatus = (report.Status ?? string.Empty).ToLower();

                    string title;
                    string message;

                    if (normalizedStatus == "resolved" || normalizedStatus == "đã xử lý")
                    {
                        title = "Báo cáo của bạn đã được xử lý";
                        message = report.Resolution ?? "Báo cáo của bạn đã được admin xử lý. Cảm ơn bạn đã gửi phản hồi.";
                    }
                    else if (normalizedStatus == "rejected" || normalizedStatus == "từ chối")
                    {
                        title = "Báo cáo của bạn đã bị từ chối";
                        message = report.Resolution ?? "Admin đã xem xét và từ chối báo cáo của bạn.";
                    }
                    else
                    {
                        title = "Báo cáo của bạn đã được cập nhật";
                        message = report.Resolution ?? $"Trạng thái mới của báo cáo: {report.Status}.";
                    }

                    var notificationDto = new NotificationDto_1
                    {
                        UserId = userId,
                        Title = title,
                        Message = message,
                        Type = "report"
                    };

                    await _notificationService.CreateNotificationAsync(notificationDto, ct);
                }
            }
            catch (Exception ex)
            {
                // Không chặn luồng chính nếu gửi thông báo lỗi
                Console.WriteLine($"[ReportService] Failed to create notification for report {reportId}: {ex.Message}");
            }

            return updatedReport;
        }
    }
}




