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
					.Include(b => b.Touser)
					.Where(b => b.Fromuserid == fromUserId)
					.Select(b => new
					{
						b.Blockid,
						b.Touserid,
						ToUserFullName = b.Touser != null ? b.Touser.Fullname : null,
						ToUserEmail = b.Touser != null ? b.Touser.Email : null,
						b.Createdat
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

				var fromUserExists = await _context.Users.AnyAsync(u => u.Userid == fromUserId);
				var toUserExists = await _context.Users.AnyAsync(u => u.Userid == toUserId);

				if (!fromUserExists || !toUserExists)
				{
					return NotFound(new { Message = "Người dùng không tồn tại." });
				}

				var existingBlock = await _context.Blocks
					.FirstOrDefaultAsync(b => b.Fromuserid == fromUserId && b.Touserid == toUserId);

				if (existingBlock != null)
				{
					return Conflict(new { Message = "Người dùng này đã bị chặn trước đó." });
				}

				var block = new Block
				{
					Fromuserid = fromUserId,
					Touserid = toUserId,
					Createdat = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
				};

				_context.Blocks.Add(block);
				await _context.SaveChangesAsync();

				return Ok(new
				{
					block.Blockid,
					block.Fromuserid,
					block.Touserid,
					block.Createdat,
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
		[HttpDelete("block/{blockId}")]
		public async Task<ActionResult> DeleteBlock(int blockId)
		{
			try
			{
				var block = await _context.Blocks.FindAsync(blockId);
				if (block == null)
				{
					return NotFound(new { Message = "Block không tồn tại." });
				}

				// Xóa block
				_context.Blocks.Remove(block);
				await _context.SaveChangesAsync();

				return Ok(new
				{
					block.Blockid,
					block.Fromuserid,
					block.Touserid,
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
