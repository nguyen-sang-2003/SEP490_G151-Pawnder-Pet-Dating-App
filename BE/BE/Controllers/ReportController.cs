using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
	[ApiController]
	public class ReportController : ControllerBase
	{
		private readonly PawnderDatabaseContext _context;
		public ReportController(PawnderDatabaseContext context)
		{
			_context = context;
		}

		// GET: api/report
		[HttpGet("report")]
		public async Task<ActionResult<IEnumerable<ReportDto>>> GetAllReports()
		{
			try
			{
				var reports = await _context.Reports
					.Include(r => r.UserReport)
					.Include(r => r.Content)
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
						//Content = r.Content != null ? new ContentDto
						//{
						//	ContentId = r.Content.ContentId,
						//	Message = r.Content.Message
						//} : null
					})
					.ToListAsync();

				return Ok(new
				{
					success = true,
					message = "Lấy danh sách báo cáo thành công.",
					data = reports
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Đã xảy ra lỗi khi lấy danh sách báo cáo.",
					error = ex.Message
				});
			}
		}

		//// GET: api/report/{reportId}
		[HttpGet("report/{reportId}")]
		public async Task<ActionResult<ReportDto>> GetReportById(int reportId)
		{
			try
			{
				var report = await _context.Reports
					.Include(r => r.UserReport)
					.Include(r => r.Content)
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
						//Content = r.Content != null ? new ContentDto
						//{
						//	ContentId = r.Content.ContentId,
						//	Message = r.Content.Message
						//} : null
					})
					.FirstOrDefaultAsync();

				if (report == null)
				{
					return NotFound(new
					{
						success = false,
						message = $"Không tìm thấy báo cáo với ID = {reportId}."
					});
				}

				return Ok(new
				{
					success = true,
					message = "Lấy thông tin báo cáo thành công.",
					data = report
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Đã xảy ra lỗi khi lấy thông tin báo cáo.",
					error = ex.Message
				});
			}
		}

		//// GET: api/report/user/{userReportId}
		[HttpGet("report/user/{userReportId}")]
		public async Task<ActionResult<IEnumerable<ReportDto>>> GetReportsByUserId(int userReportId)
		{
			try
			{
				var reports = await _context.Reports
					.Include(r => r.UserReport)
					.Include(r => r.Content)
					.Where(r => r.UserReportId == userReportId)
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
						//Content = r.Content != null ? new ContentDto
						//{
						//	ContentId = r.Content.ContentId,
						//	Message = r.Content.Message
						//} : null
					})
					.ToListAsync();

				if (!reports.Any())
				{
					return NotFound(new
					{
						success = false,
						message = $"Không tìm thấy báo cáo nào được gửi bởi người dùng có ID = {userReportId}."
					});
				}

				return Ok(new
				{
					success = true,
					message = $"Lấy danh sách báo cáo từ người dùng {userReportId} thành công.",
					data = reports
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Đã xảy ra lỗi khi lấy danh sách báo cáo của người dùng.",
					error = ex.Message
				});
			}
		}

		//// GET: api/report/user/{userReportId}
		[HttpPost("report/{userReportId}/{contentId}")]
		public async Task<IActionResult> CreateReport(int userReportId, int contentId, [FromBody] ReportCreateDTO dto)
		{
			if (string.IsNullOrWhiteSpace(dto.Reason))
			{
				return BadRequest(new
				{
					success = false,
					message = "Reason is required."
				});
			}

			// Kiểm tra User tồn tại
			var user = await _context.Users.FindAsync(userReportId);
			if (user == null)
				return NotFound(new { success = false, message = $"User with ID {userReportId} not found." });

			// Kiểm tra Content tồn tại
			var content = await _context.ChatUserContents.FindAsync(contentId);
			if (content == null)
				return NotFound(new { success = false, message = $"Content with ID {contentId} not found." });

			// Tạo Report mới với DateTimeKind.Unspecified
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

			_context.Reports.Add(report);
			await _context.SaveChangesAsync();

			// Tạo DTO trả về
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
				},
				//Content = new ContentDto
				//{
				//	ContentId = content.ContentId,
				//	Message = content.Message
				//}
			};

			return CreatedAtAction(nameof(GetReportById), new { reportId = report.ReportId }, new
			{
				success = true,
				message = "Tạo báo cáo thành công.",
				data = reportDto
			});
		}

		//// PUT: api/report/{reportId}
		[HttpPut("report/{reportId}")]
		public async Task<IActionResult> UpdateReport(int reportId, [FromBody] ReportUpdateDTO dto)
		{
			// Tìm report cần cập nhật
			var report = await _context.Reports.FindAsync(reportId);
			if (report == null)
			{
				return NotFound(new
				{
					success = false,
					message = $"Report with ID {reportId} not found."
				});
			}

			// Cập nhật các trường nếu được cung cấp
			if (!string.IsNullOrWhiteSpace(dto.Status))
				report.Status = dto.Status;

			if (!string.IsNullOrWhiteSpace(dto.Resolution))
				report.Resolution = dto.Resolution;

			// Cập nhật UpdatedAt với DateTimeKind.Unspecified
			report.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

			try
			{
				await _context.SaveChangesAsync();
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Error updating report.",
					error = ex.Message
				});
			}

			// Tạo DTO trả về
			var reportDto = await _context.Reports
				.Include(r => r.UserReport)
				.Include(r => r.Content)
				.Where(r => r.ReportId == report.ReportId)
				.Select(r => new ReportDto
				{
					ReportId = r.ReportId,
					Reason = r.Reason,
					Resolution = r.Resolution,
					Status = r.Status,
					CreatedAt = r.CreatedAt,
					UpdatedAt = r.UpdatedAt,
					UserReport = r.UserReport != null ? new UserReportDto
					{
						UserId = r.UserReport.UserId,
						FullName = r.UserReport.FullName,
						Email = r.UserReport.Email
					} : null,
					//Content = r.Content != null ? new ContentDto
					//{
					//	ContentId = r.Content.ContentId,
					//	Message = r.Content.Message
					//} : null
				})
				.FirstOrDefaultAsync();

			return Ok(new
			{
				success = true,
				message = "Cập nhật báo cáo thành công.",
				data = reportDto
			});
		}

	}
}
