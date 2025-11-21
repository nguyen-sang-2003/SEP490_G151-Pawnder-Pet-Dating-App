using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
	/// <summary>
	/// Controller cho Block - chỉ nhận request và trả response
	/// </summary>
	[ApiController]
	public class BlockController : ControllerBase
	{
		private readonly IBlockService _blockService;

		public BlockController(IBlockService blockService)
		{
			_blockService = blockService;
		}

		// GET /block/{fromUserId}
		[HttpGet("block/{fromUserId}")]
		[Authorize(Roles = "User")]
		public async Task<ActionResult> GetBlockedUsers(int fromUserId, CancellationToken ct = default)
		{
			try
			{
				var blockedUsers = await _blockService.GetBlockedUsersAsync(fromUserId, ct);

				if (!blockedUsers.Any())
					return NotFound(new { Message = "Người dùng này chưa chặn ai." });

				return Ok(blockedUsers);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		// POST /block/{fromUserId}/{toUserId}
		[HttpPost("block/{fromUserId}/{toUserId}")]
		[Authorize(Roles = "User")]
		public async Task<ActionResult> CreateBlock(int fromUserId, int toUserId, CancellationToken ct = default)
		{
			try
			{
				var result = await _blockService.CreateBlockAsync(fromUserId, toUserId, ct);
				return Ok(result);
			}
			catch (InvalidOperationException ex)
			{
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

		// DELETE /block/{fromUserId}/{toUserId}
		[HttpDelete("block/{fromUserId}/{toUserId}")]
		[Authorize(Roles = "User")]
		public async Task<ActionResult> DeleteBlock(int fromUserId, int toUserId, CancellationToken ct = default)
		{
			try
			{
				var success = await _blockService.DeleteBlockAsync(fromUserId, toUserId, ct);

				if (!success)
					return NotFound(new { Message = "Chưa chặn người dùng này hoặc đã hủy chặn." });

				return Ok(new
				{
					FromUserId = fromUserId,
					ToUserId = toUserId,
					Message = "Hủy chặn người dùng thành công."
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}
	}
}
