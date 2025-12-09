using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
	/// <summary>
	/// Controller cho Report - chỉ nhận request và trả response
	/// </summary>
	[ApiController]
	[Route("api")]
	public class ReportController : ControllerBase
	{
		private readonly IReportService _reportService;

		public ReportController(IReportService reportService)
		{
			_reportService = reportService;
		}

		// GET: api/report
		[HttpGet("report")]
		[Authorize(Roles = "Admin")]
		public async Task<ActionResult<IEnumerable<ReportDto>>> GetAllReports(CancellationToken ct = default)
		{
			try
			{
				var reports = await _reportService.GetAllReportsAsync(ct);
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

		// GET: api/report/{reportId}
		[HttpGet("report/{reportId}")]
		[Authorize(Roles = "Admin,User")]
		public async Task<ActionResult<ReportDto>> GetReportById(int reportId, CancellationToken ct = default)
		{
			try
			{
				var report = await _reportService.GetReportByIdAsync(reportId, ct);
				
				if (report == null)
				{
					return NotFound(new
					{
						success = false,
						message = $"Không tìm thấy báo cáo với ID = {reportId}."
					});
				}

				// Debug logging
				Console.WriteLine($"[ReportController] ReportId: {report.ReportId}, ContentId: {report.ContentId}, Content: {(report.Content != null ? $"Message={report.Content.Message}" : "null")}");

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

		// GET: api/report/user/{userReportId}
		[HttpGet("report/user/{userReportId}")]
		[Authorize(Roles = "User")]
		public async Task<ActionResult<IEnumerable<ReportDto>>> GetReportsByUserId(int userReportId, CancellationToken ct = default)
		{
			try
			{
				var result = await _reportService.GetReportsByUserIdAsync(userReportId, ct);

				if (!result.Any())
				{
					return Ok(new
					{
						success = true,
						message = "Bạn chưa gửi báo cáo nào.",
						data = new List<object>()
					});
				}

				return Ok(new
				{
					success = true,
					message = $"Lấy danh sách báo cáo thành công.",
					data = result
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

		// POST: api/report/{userReportId}/{contentId}
		[HttpPost("report/{userReportId}/{contentId}")]
		[Authorize(Roles = "User")]
		public async Task<IActionResult> CreateReport(int userReportId, int contentId, [FromBody] ReportCreateDTO dto, CancellationToken ct = default)
		{
			try
			{
				var result = await _reportService.CreateReportAsync(userReportId, contentId, dto, ct);
				return CreatedAtAction(nameof(GetReportById), new { reportId = ((dynamic)result).data.ReportId }, result);
			}
			catch (ArgumentException ex)
			{
				return BadRequest(new
				{
					success = false,
					message = ex.Message
				});
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { success = false, message = ex.Message });
			}
			catch (InvalidOperationException ex)
			{
				return BadRequest(new { success = false, message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new
				{
					success = false,
					message = "Đã xảy ra lỗi khi tạo báo cáo.",
					error = ex.Message
				});
			}
		}

		// PUT: api/report/{reportId}
		[HttpPut("report/{reportId}")]
		[Authorize(Roles = "Admin,User")]
		public async Task<IActionResult> UpdateReport(int reportId, [FromBody] ReportUpdateDTO dto, CancellationToken ct = default)
		{
			try
			{
				var reportDto = await _reportService.UpdateReportAsync(reportId, dto, ct);
				return Ok(new
				{
					success = true,
					message = "Cập nhật báo cáo thành công.",
					data = reportDto
				});
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new
				{
					success = false,
					message = ex.Message
				});
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
		}
	}
}
