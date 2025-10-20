using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
	
	[ApiController]
	public class ExpertController : ControllerBase
	{
		private readonly PawnderDatabaseContext _context;
		public ExpertController(PawnderDatabaseContext context)
		{
			_context = context;
		}

		// GET: /api/expert-confirmation
		[HttpGet("expert-confirmation")]
		public async Task<ActionResult<IEnumerable<ExpertConfirmationDTO>>> GetAllExpertConfirmations()
		{
			var confirmations = await _context.Expertconfirmations
				.Include(e => e.Expert)
				.Include(e => e.Userrequest)
				.Select(e => new ExpertConfirmationDTO
				{
					ConfirmationId = e.Confirmationid,
					UserRequestId = e.Userrequestid,
					UserRequestName = e.Userrequest != null ? e.Userrequest.Fullname : null,
					ExpertId = e.Expertid,
					ExpertName = e.Expert != null ? e.Expert.Fullname : null,
					ContentConfirmation = e.Contentconfirmation,
					ContentAccurate = e.Contentaccurate,
					Status = e.Status,
					CreatedAt = e.Createdat,
					UpdatedAt = e.Updatedat
				})
				.ToListAsync();

			return Ok(confirmations);
		}

		// GET: /api/expert-confirmation/{confirmationId}/{userId}/{chatId}
		[HttpGet("expert-confirmation/{confirmationId:int}/{userId:int}/{chatId:int}")]
		public async Task<ActionResult<ExpertConfirmationDTO>> GetExpertConfirmationById(
			int confirmationId, int userId, int chatId)
		{
			var confirmation = await _context.Expertconfirmations
				.Include(e => e.Expert)
				.Include(e => e.Userrequest)
				.Where(e => e.Confirmationid == confirmationId)
				.Select(e => new ExpertConfirmationDTO
				{
					ConfirmationId = e.Confirmationid,
					UserRequestId = e.Userrequestid,
					UserRequestName = e.Userrequest != null ? e.Userrequest.Fullname : null,
					ExpertId = e.Expertid,
					ExpertName = e.Expert != null ? e.Expert.Fullname : null,
					ContentConfirmation = e.Contentconfirmation,
					ContentAccurate = e.Contentaccurate,
					Status = e.Status,
					CreatedAt = e.Createdat,
					UpdatedAt = e.Updatedat
				})
				.FirstOrDefaultAsync();

			if (confirmation == null)
			{
				return NotFound(new { message = "Không tìm thấy yêu cầu xác nhận." });
			}

			return Ok(confirmation);
		}

		// GET: /api/expert-confirmation/{userId}
		[HttpGet("expert-confirmation/{userId:int}")]
		public async Task<ActionResult<IEnumerable<ExpertConfirmationDTO>>> GetConfirmationsByUserId(int userId)
		{
			var confirmations = await _context.Expertconfirmations
				.Include(e => e.Expert)
				.Include(e => e.Userrequest)
				.Where(e => e.Userrequestid == userId)
				.Select(e => new ExpertConfirmationDTO
				{
					ConfirmationId = e.Confirmationid,
					UserRequestId = e.Userrequestid,
					UserRequestName = e.Userrequest != null ? e.Userrequest.Fullname : null,
					ExpertId = e.Expertid,
					ExpertName = e.Expert != null ? e.Expert.Fullname : null,
					ContentConfirmation = e.Contentconfirmation,
					ContentAccurate = e.Contentaccurate,
					Status = e.Status,
					CreatedAt = e.Createdat,
					UpdatedAt = e.Updatedat
				})
				.ToListAsync();

			if (confirmations == null || !confirmations.Any())
				return NotFound(new { message = "Người dùng này chưa có yêu cầu xác nhận nào." });

			return Ok(confirmations);
		}

		[HttpPost("expert-confirmation/{userId:int}/{chatId:int}")]
		public async Task<ActionResult<ExpertConfirmationDTO>> CreateUserConfirmRequest(
		int userId, int chatId, [FromBody] ExpertConfirmationCreateDTO dto)
		{
			var user = await _context.Users.FindAsync(userId);
			if (user == null)
				return NotFound(new { message = "Không tìm thấy người dùng gửi yêu cầu." });

			var expert = await _context.Users.FindAsync(dto.ExpertId);
			if (expert == null)
				return NotFound(new { message = "Không tìm thấy chuyên gia được yêu cầu xác nhận." });

			var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

			var confirmation = new Expertconfirmation
			{
				Userrequestid = userId,
				Expertid = dto.ExpertId,
				Contentconfirmation = dto.ContentConfirmation,
				Contentaccurate = null,
				Status = "Pending",
				Createdat = now,
				Updatedat = now
			};

			_context.Expertconfirmations.Add(confirmation);
			await _context.SaveChangesAsync();

			var result = new ExpertConfirmationDTO
			{
				ConfirmationId = confirmation.Confirmationid,
				UserRequestId = confirmation.Userrequestid,
				UserRequestName = user.Fullname,
				ExpertId = confirmation.Expertid,
				ExpertName = expert.Fullname,
				ContentConfirmation = confirmation.Contentconfirmation,
				ContentAccurate = confirmation.Contentaccurate,
				Status = confirmation.Status,
				CreatedAt = confirmation.Createdat,
				UpdatedAt = confirmation.Updatedat
			};

			return CreatedAtAction(
				nameof(GetExpertConfirmationById),
				new { confirmationId = result.ConfirmationId, userId = userId, chatId = chatId },
				result
			);
		}

		[HttpPut("expert-confirmation/{confirmationId:int}/{userId:int}/{chatId:int}")]
		public async Task<ActionResult<ExpertConfirmationDTO>> UpdateExpertConfirmation(
		int confirmationId, int userId, int chatId, [FromBody] ExpertConfirmationUpdateDTO dto)
		{
			var confirmation = await _context.Expertconfirmations
				.Include(c => c.Expert)
				.Include(c => c.Userrequest)
				.FirstOrDefaultAsync(c => c.Confirmationid == confirmationId
										  && c.Userrequestid == userId
										  && c.Expertid == dto.ExpertId);
			if (confirmation == null)
				return NotFound(new { message = "Không tìm thấy yêu cầu xác nhận." });

			if (dto.ContentConfirmation != null)
				confirmation.Contentconfirmation = dto.ContentConfirmation;

			if (dto.ContentAccurate.HasValue)
				confirmation.Contentaccurate = dto.ContentAccurate;

			if (dto.Status != null)
				confirmation.Status = dto.Status;

			confirmation.Updatedat = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

			await _context.SaveChangesAsync();

			var result = new ExpertConfirmationDTO
			{
				ConfirmationId = confirmation.Confirmationid,
				UserRequestId = confirmation.Userrequestid,
				UserRequestName = confirmation.Userrequest?.Fullname,
				ExpertId = confirmation.Expertid,
				ExpertName = confirmation.Expert?.Fullname,
				ContentConfirmation = confirmation.Contentconfirmation,
				ContentAccurate = confirmation.Contentaccurate,
				Status = confirmation.Status,
				CreatedAt = confirmation.Createdat,
				UpdatedAt = confirmation.Updatedat
			};

			return Ok(result);
		}
	}
}
