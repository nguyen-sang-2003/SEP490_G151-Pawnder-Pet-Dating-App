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
		public async Task<ActionResult<IEnumerable<ReportDTO>>> GetReports()
		{
			var reports = await _context.Reports
				.Include(r => r.Fromuser)
				.Include(r => r.Touser)
				.Select(r => new ReportDTO
				{
					Reportid = r.Reportid,
					Reason = r.Reason,
					Status = r.Status,
					Resolution = r.Resolution,
					Createdat = r.Createdat,
					Updatedat = r.Updatedat,
					Fromuser = r.Fromuser == null ? null : new UserDTO
					{
						Userid = r.Fromuser.Userid,
						Fullname = r.Fromuser.Fullname,
						Email = r.Fromuser.Email
					},
					Touser = r.Touser == null ? null : new UserDTO
					{
						Userid = r.Touser.Userid,
						Fullname = r.Touser.Fullname,
						Email = r.Touser.Email
					}
				})
				.ToListAsync();

			return Ok(reports);
		}

		// GET: api/report/{reportId}
		[HttpGet("report/{reportId}")]
		public async Task<ActionResult<ReportDTO>> GetReport(int reportId)
		{
			var report = await _context.Reports
				.Include(r => r.Fromuser)
				.Include(r => r.Touser)
				.Where(r => r.Reportid == reportId)
				.Select(r => new ReportDTO
				{
					Reportid = r.Reportid,
					Reason = r.Reason,
					Status = r.Status,
					Resolution = r.Resolution,
					Createdat = r.Createdat,
					Updatedat = r.Updatedat,
					Fromuser = r.Fromuser == null ? null : new UserDTO
					{
						Userid = r.Fromuser.Userid,
						Fullname = r.Fromuser.Fullname,
						Email = r.Fromuser.Email
					},
					Touser = r.Touser == null ? null : new UserDTO
					{
						Userid = r.Touser.Userid,
						Fullname = r.Touser.Fullname,
						Email = r.Touser.Email
					}
				})
				.FirstOrDefaultAsync();

			if (report == null)
			{
				return NotFound(new { message = "Không có tìm thấy báo cáo" });
			}

			return Ok(report);
		}

		// GET: api/report/user/{userReportId}
		[HttpGet("report/user/{userReportId}")]
		public async Task<ActionResult<IEnumerable<ReportDTO>>> GetReportsByUser(int userReportId)
		{
			var reports = await _context.Reports
				.Include(r => r.Fromuser)
				.Include(r => r.Touser)
				.Where(r => r.Fromuserid == userReportId)
				.Select(r => new ReportDTO
				{
					Reportid = r.Reportid,
					Reason = r.Reason,
					Status = r.Status,
					Resolution = r.Resolution,
					Createdat = r.Createdat,
					Updatedat = r.Updatedat,
					Fromuser = r.Fromuser == null ? null : new UserDTO
					{
						Userid = r.Fromuser.Userid,
						Fullname = r.Fromuser.Fullname,
						Email = r.Fromuser.Email
					},
					Touser = r.Touser == null ? null : new UserDTO
					{
						Userid = r.Touser.Userid,
						Fullname = r.Touser.Fullname,
						Email = r.Touser.Email
					}
				})
				.ToListAsync();

			if (reports.Count == 0)
			{
				return NotFound(new { message = "Không tìm thấy báo cáo của người dùng này" });
			}

			return Ok(reports);
		}

		// POST: api/report/{fromUserId}/{toUserId}
		[HttpPost("report/{fromUserId}/{toUserId}")]
		public async Task<ActionResult<ReportDTO>> CreateReport(int fromUserId, int toUserId, [FromBody] ReportCreateDTO reportCreateDTO)
		{
			var fromUser = await _context.Users.FindAsync(fromUserId);
			if (fromUser == null)
				return NotFound(new { message = "From user not found" });

			var toUser = await _context.Users.FindAsync(toUserId);
			if (toUser == null)
				return NotFound(new { message = "To user not found" });

			var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

			var report = new Report
			{
				Fromuserid = fromUserId,
				Touserid = toUserId,
				Reason = reportCreateDTO.Reason,
				Status = "Pending",
				Resolution = null,
				Createdat = now,
				Updatedat = now
			};

			_context.Reports.Add(report);
			await _context.SaveChangesAsync();

			var reportDTO = new ReportDTO
			{
				Reportid = report.Reportid,
				Reason = report.Reason,
				Status = report.Status,
				Resolution = report.Resolution,
				Createdat = report.Createdat,
				Updatedat = report.Updatedat,
				Fromuser = new UserDTO
				{
					Userid = fromUser.Userid,
					Fullname = fromUser.Fullname,
					Email = fromUser.Email
				},
				Touser = new UserDTO
				{
					Userid = toUser.Userid,
					Fullname = toUser.Fullname,
					Email = toUser.Email
				}
			};

			return CreatedAtAction(nameof(GetReport), new { reportId = report.Reportid }, reportDTO);
		}

		// PUT: api/report/{reportId}
		[HttpPut("report/{reportId}")]
		public async Task<IActionResult> UpdateReport(int reportId, [FromBody] ReportUpdateDTO updateDTO)
		{
			var report = await _context.Reports.FindAsync(reportId);

			if (report == null)
				return NotFound(new { message = "Report not found" });

			if (!string.IsNullOrEmpty(updateDTO.Status))
				report.Status = updateDTO.Status;

			if (!string.IsNullOrEmpty(updateDTO.Resolution))
				report.Resolution = updateDTO.Resolution;

			report.Updatedat = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

			try
			{
				await _context.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				return StatusCode(500, new { message = "Error updating report", detail = ex.Message });
			}

			var reportDTO = new ReportDTO
			{
				Reportid = report.Reportid,
				Reason = report.Reason,
				Status = report.Status,
				Resolution = report.Resolution,
				Createdat = report.Createdat,
				Updatedat = report.Updatedat,
				Fromuser = report.Fromuser != null ? new UserDTO
				{
					Userid = report.Fromuser.Userid,
					Fullname = report.Fromuser.Fullname,
					Email = report.Fromuser.Email
				} : null,
				Touser = report.Touser != null ? new UserDTO
				{
					Userid = report.Touser.Userid,
					Fullname = report.Touser.Fullname,
					Email = report.Touser.Email
				} : null
			};

			return Ok(reportDTO);
		}

	}
}
