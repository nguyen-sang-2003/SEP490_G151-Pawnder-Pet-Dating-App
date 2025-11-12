using BE.DTO;
using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{

	[ApiController]
	public class ExpertController : ControllerBase
	{
		private readonly PawnderDatabaseContext _context;
		private readonly DailyLimitService _dailyLimitService;
		
		public ExpertController(PawnderDatabaseContext context, DailyLimitService dailyLimitService)
		{
			_context = context;
			_dailyLimitService = dailyLimitService;
		}

		//// GET: /api/expert-confirmation
		[HttpGet("expert-confirmation")]
		public async Task<ActionResult<List<ExpertConfirmationDTO>>> GetAllExpertConfirmations()
		{
			try
			{
				var confirmations = await _context.ExpertConfirmations
					.Include(ec => ec.User)
					.Include(ec => ec.Expert)
					.Include(ec => ec.ChatAi)
					.ToListAsync();

				var result = confirmations.Select(ec => new ExpertConfirmationDTO
				{
					UserId = ec.UserId,
					ChatAiId = ec.ChatAiid,
					ExpertId = ec.ExpertId,
					Status = ec.Status,
					Message = ec.Message,
					CreatedAt = ec.CreatedAt,
					UpdatedAt = ec.UpdatedAt
				}).ToList();

				return Ok(result);
			}
			catch (Exception ex)
			{
				var errorMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = errorMessage });
			}
		}

		// GET: /api/expert-confirmation/{confirmationId}/{userId}/{chatId}
		[HttpGet("expert-confirmation/{userId:int}/{chatId:int}")]
		public async Task<ActionResult<ExpertConfirmationDTO>> GetExpertConfirmation(
	int expertId, int userId, int chatId)
		{
			try
			{
				var expertConfirmation = await _context.ExpertConfirmations
					.Include(ec => ec.User)
					.Include(ec => ec.Expert)
					.Include(ec => ec.ChatAi)
					.FirstOrDefaultAsync(ec => ec.ExpertId == expertId
											   && ec.UserId == userId
											   && ec.ChatAiid == chatId);

				if (expertConfirmation == null)
					return NotFound(new { Message = "Yêu cầu xác nhận không tồn tại." });

				var dto = new ExpertConfirmationDTO
				{
					UserId = expertConfirmation.UserId,
					ChatAiId = expertConfirmation.ChatAiid,
					ExpertId = expertConfirmation.ExpertId,
					Status = expertConfirmation.Status,
					Message = expertConfirmation.Message,
					CreatedAt = expertConfirmation.CreatedAt,
					UpdatedAt = expertConfirmation.UpdatedAt
				};

				return Ok(dto);
			}
			catch (Exception ex)
			{
				var errorMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = errorMessage });
			}
		}

		//// GET: /api/expert-confirmation/{userId}
		[HttpGet("expert-confirmation/{userId:int}")]
		public async Task<ActionResult<List<ExpertConfirmationDTO>>> GetUserExpertConfirmations(int userId)
		{
			try
			{
				// Kiểm tra User tồn tại
				var user = await _context.Users.FindAsync(userId);
				if (user == null)
					return NotFound(new { Message = "Người dùng không tồn tại." });

				var confirmations = await _context.ExpertConfirmations
					.Where(ec => ec.UserId == userId)
					.Include(ec => ec.Expert)
					.Include(ec => ec.ChatAi)
					.ToListAsync();

				var result = confirmations.Select(ec => new ExpertConfirmationDTO
				{
					UserId = ec.UserId,
					ChatAiId = ec.ChatAiid,
					ExpertId = ec.ExpertId,
					Status = ec.Status,
					Message = ec.Message,
					CreatedAt = ec.CreatedAt,
					UpdatedAt = ec.UpdatedAt
				}).ToList();

				return Ok(result);
			}
			catch (Exception ex)
			{
				var errorMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = errorMessage });
			}
		}

	[HttpPost("expert-confirmation/{userId}/{chatId}")]
	public async Task<ActionResult<ExpertConfirmationResponseDTO>> CreateExpertConfirmation(
int userId, int chatId, [FromBody] ExpertConfirmationCreateDTO dto)
	{
		try
		{
			// 🔒 CHECK DAILY LIMIT (Free: 3, VIP: 10)
			bool canConfirm = await _dailyLimitService.CanPerformAction(userId, "expert_confirm");
			if (!canConfirm)
			{
				int remaining = await _dailyLimitService.GetRemainingCount(userId, "expert_confirm");
				return StatusCode(429, new 
				{ 
					Message = "Bạn đã hết lượt yêu cầu chuyên gia xác nhận hôm nay! Nâng cấp lên VIP để sử dụng không giới hạn.",
					Remaining = remaining,
					ActionType = "expert_confirm"
				});
			}

			var user = await _context.Users.FindAsync(userId);
			if (user == null)
				return NotFound(new { Message = "Người dùng không tồn tại." });

			var chat = await _context.ChatAis.FindAsync(chatId);
			if (chat == null)
				return NotFound(new { Message = "Chat AI không tồn tại." });

				var expert = await _context.Users.FindAsync(dto.ExpertId);
				if (expert == null)
					return NotFound(new { Message = "Chuyên gia không tồn tại." });

				var existingConfirmation = await _context.ExpertConfirmations
					.FirstOrDefaultAsync(ec => ec.UserId == userId && ec.ChatAiid == chatId);
				if (existingConfirmation != null)
					return BadRequest(new { Message = "Yêu cầu xác nhận đã tồn tại." });

				var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

				var expertConfirmation = new ExpertConfirmation
				{
					UserId = userId,
					ExpertId = expert.UserId,
					ChatAiid = chatId,
					Status = "pending",
					Message = dto.Message,
					CreatedAt = now,
					UpdatedAt = now
				};

			_context.ExpertConfirmations.Add(expertConfirmation);
			await _context.SaveChangesAsync();

			// 📝 RECORD ACTION TO DAILY LIMIT
			await _dailyLimitService.RecordAction(userId, "expert_confirm");
			int remainingConfirms = await _dailyLimitService.GetRemainingCount(userId, "expert_confirm");
			Console.WriteLine($"✅ Expert confirm recorded. User {userId} has {remainingConfirms} confirms remaining today.");

			var response = new ExpertConfirmationResponseDTO
				{
					UserId = expertConfirmation.UserId,
					ChatAiId = expertConfirmation.ChatAiid,
					ExpertId = expertConfirmation.ExpertId,
					Status = expertConfirmation.Status,
					Message = expertConfirmation.Message,
					ResultMessage = "Yêu cầu chuyên gia xác nhận đã được tạo thành công.",
					CreatedAt = expertConfirmation.CreatedAt,
					UpdatedAt = expertConfirmation.UpdatedAt
				};

				return Ok(response);
			}
			catch (Exception ex)
			{
				var errorMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = errorMessage });
			}
		}

		[HttpPut("expert-confirmation/{confirmationId:int}/{userId:int}/{chatId:int}")]
		public async Task<ActionResult<ExpertConfirmationResponseDTO>> UpdateExpertConfirmation(
	int confirmationId, int userId, int chatId,
	[FromBody] ExpertConfirmationUpdateDto dto)
		{
			try
			{
				var expertConfirmation = await _context.ExpertConfirmations
					.FirstOrDefaultAsync(ec => ec.UserId == userId && ec.ChatAiid == chatId && ec.ExpertId == confirmationId);

				if (expertConfirmation == null)
					return NotFound(new { Message = "Yêu cầu xác nhận không tồn tại." });

				if (!string.IsNullOrEmpty(dto.Status))
					expertConfirmation.Status = dto.Status;

				if (!string.IsNullOrEmpty(dto.Message))
					expertConfirmation.Message = dto.Message;

				expertConfirmation.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

				await _context.SaveChangesAsync();

				var response = new ExpertConfirmationResponseDTO
				{
					UserId = expertConfirmation.UserId,
					ChatAiId = expertConfirmation.ChatAiid,
					ExpertId = expertConfirmation.ExpertId,
					Status = expertConfirmation.Status,
					Message = expertConfirmation.Message,
					ResultMessage = "Cập nhật yêu cầu confirm thành công",
					CreatedAt = expertConfirmation.CreatedAt,
					UpdatedAt = expertConfirmation.UpdatedAt
				};

				return Ok(response);
			}
			catch (Exception ex)
			{
				var errorMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = errorMessage });
			}
		}
	}
}
