using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
	/// <summary>
	/// Controller cho ExpertConfirmation - chỉ nhận request và trả response
	/// </summary>
	[ApiController]
	public class ExpertController : ControllerBase
	{
		private readonly IExpertConfirmationService _expertConfirmationService;
		
		public ExpertController(IExpertConfirmationService expertConfirmationService)
		{
			_expertConfirmationService = expertConfirmationService;
		}

		// GET: /expert-confirmation
		[HttpGet("expert-confirmation")]
		[Authorize(Roles = "Admin,Expert")]
		public async Task<ActionResult<List<ExpertConfirmationDTO>>> GetAllExpertConfirmations(CancellationToken ct = default)
		{
			try
			{
				var result = await _expertConfirmationService.GetAllExpertConfirmationsAsync(ct);
				return Ok(result);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		// GET: /expert-confirmation/{expertId}/{userId}/{chatId}
		[HttpGet("expert-confirmation/{expertId:int}/{userId:int}/{chatId:int}")]
		[Authorize(Roles = "Admin,Expert")]
		public async Task<ActionResult<ExpertConfirmationDTO>> GetExpertConfirmation(
			int expertId, int userId, int chatId, CancellationToken ct = default)
		{
			try
			{
				var dto = await _expertConfirmationService.GetExpertConfirmationAsync(expertId, userId, chatId, ct);
				
				if (dto == null)
					return NotFound(new { Message = "Yêu cầu xác nhận không tồn tại." });

				return Ok(dto);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		// GET: /expert-confirmation/{userId}
		[HttpGet("expert-confirmation/{userId:int}")]
		[Authorize(Roles = "User,Expert,Admin")]
		public async Task<ActionResult<List<ExpertConfirmationDTO>>> GetUserExpertConfirmations(int userId, CancellationToken ct = default)
		{
			try
			{
				var result = await _expertConfirmationService.GetUserExpertConfirmationsAsync(userId, ct);
				return Ok(result);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { Message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		[HttpPost("expert-confirmation/{userId}/{chatId}")]
		[Authorize(Roles = "User")]
		public async Task<ActionResult<ExpertConfirmationResponseDTO>> CreateExpertConfirmation(
			int userId, int chatId, [FromBody] ExpertConfirmationCreateDTO dto, CancellationToken ct = default)
		{
			try
			{
				var response = await _expertConfirmationService.CreateExpertConfirmationAsync(userId, chatId, dto, ct);
				return Ok(response);
			}
			catch (InvalidOperationException ex)
			{
				// Handle daily limit exceeded
				if (ex.Message.Contains("hết lượt"))
				{
					return StatusCode(429, new 
					{ 
						Message = ex.Message,
						ActionType = "expert_confirm"
					});
				}
				return BadRequest(new { Message = ex.Message });
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { Message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		[HttpPut("expert-confirmation/{expertId:int}/{userId:int}/{chatId:int}")]
		[Authorize(Roles = "Expert,Admin")]
		public async Task<ActionResult<ExpertConfirmationResponseDTO>> UpdateExpertConfirmation(
			int expertId, int userId, int chatId,
			[FromBody] ExpertConfirmationUpdateDto dto, CancellationToken ct = default)
		{
			try
			{
				var response = await _expertConfirmationService.UpdateExpertConfirmationAsync(expertId, userId, chatId, dto, ct);
				return Ok(response);
			}
			catch (KeyNotFoundException ex)
			{
				return NotFound(new { Message = ex.Message });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		// GET: /expert-chats/{userId}
		[HttpGet("expert-chats/{userId:int}")]
		[Authorize(Roles = "User,Expert,Admin")]
		public async Task<ActionResult> GetUserExpertChats(int userId, CancellationToken ct = default)
		{
			try
			{
				var chats = await _expertConfirmationService.GetUserExpertChatsAsync(userId, ct);
				return Ok(new { success = true, data = chats });
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { success = false, message = "Lỗi hệ thống", error = ex.Message });
			}
		}
	}
}
