using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BE.Controllers
{
	[ApiController]
	public class BlockController : ControllerBase
	{
		private readonly PawnderDatabaseContext _context;

		public BlockController(PawnderDatabaseContext context)
		{
			_context = context;
		}

		// GET /block/{fromUserId}
		[HttpGet("block/{fromUserId}")]
		public async Task<ActionResult> GetBlockedUsers(int fromUserId)
		{
			try
			{
				var blockedUsers = await _context.Blocks
					.Include(b => b.ToUser)
					.Where(b => b.FromUserId == fromUserId)
					.Select(b => new
					{
						b.ToUserId,
						ToUserFullName = b.ToUser != null ? b.ToUser.FullName : null,
						ToUserEmail = b.ToUser != null ? b.ToUser.Email : null,
						b.CreatedAt
					})
					.ToListAsync();

				if (!blockedUsers.Any())
				{
					return NotFound(new { Message = "Người dùng này chưa chặn ai." });
				}

				return Ok(blockedUsers);
			}
			catch (Exception ex)
			{
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
			}
		}

		// POST /block/{fromUserId}/{toUserId}
		[HttpPost("block/{fromUserId}/{toUserId}")]
		public async Task<ActionResult> CreateBlock(int fromUserId, int toUserId)
		{
			try
			{
				if (fromUserId == toUserId)
				{
					return BadRequest(new { Message = "Người dùng không thể tự chặn chính mình." });
				}

				var fromUserExists = await _context.Users.AnyAsync(u => u.UserId == fromUserId);
				var toUserExists = await _context.Users.AnyAsync(u => u.UserId == toUserId);

				if (!fromUserExists || !toUserExists)
				{
					return NotFound(new { Message = "Người dùng không tồn tại." });
				}

				var existingBlock = await _context.Blocks
					.FirstOrDefaultAsync(b => b.FromUserId == fromUserId && b.ToUserId == toUserId);

				if (existingBlock != null)
				{
					return Conflict(new { Message = "Người dùng này đã bị chặn trước đó." });
				}

				var block = new Block
				{
					FromUserId = fromUserId,
					ToUserId = toUserId,
					CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
				};

				_context.Blocks.Add(block);
				await _context.SaveChangesAsync();

				return Ok(new
				{
					block.FromUserId,
					block.ToUserId,
					block.CreatedAt,
					Message = "Chặn người dùng thành công."
				});
			}
			catch (Exception ex)
			{
				var errorMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = errorMessage });
			}
		}

		// DELETE /block/{blockId}
		[HttpDelete("block/{fromUserId}/{toUserId}")]
		public async Task<ActionResult> DeleteBlock(int fromUserId, int toUserId)
		{
			try
			{
				var block = await _context.Blocks
					.FirstOrDefaultAsync(b => b.FromUserId == fromUserId && b.ToUserId == toUserId);

				if (block == null)
					return NotFound(new { Message = "Chưa chặn người dùng này hoặc đã hủy chặn." });

				_context.Blocks.Remove(block);
				await _context.SaveChangesAsync();

				return Ok(new
				{
					block.FromUserId,
					block.ToUserId,
					Message = "Hủy chặn người dùng thành công."
				});
			}
			catch (Exception ex)
			{
				var errorMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
				return StatusCode(500, new { Message = "Lỗi hệ thống", Error = errorMessage });
			}
		}
	}
}
