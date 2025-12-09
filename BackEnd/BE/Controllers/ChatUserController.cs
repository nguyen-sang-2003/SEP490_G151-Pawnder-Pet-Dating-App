using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho ChatUser - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ChatUserController : Controller
    {
        private readonly IChatUserService _chatUserService;

        public ChatUserController(IChatUserService chatUserService)
        {
            _chatUserService = chatUserService;
        }

        // GET /invite/{userId}
        [HttpGet("invite/{userId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetInvites(int userId, CancellationToken ct = default)
        {
            try
            {
                var invites = await _chatUserService.GetInvitesAsync(userId, ct);
                return Ok(invites);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /chat/{userId}?petId={petId}
        [HttpGet("chat/{userId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetChats(int userId, [FromQuery] int? petId = null, CancellationToken ct = default)
        {
            try
            {
                var chats = await _chatUserService.GetChatsAsync(userId, petId, ct);
                return Ok(chats);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /invite/{fromPetId}/{toPetId}
        [HttpPost("invite/{fromPetId}/{toPetId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> CreateFriendRequest(int fromPetId, int toPetId, CancellationToken ct = default)
        {
            try
            {
                var result = await _chatUserService.CreateFriendRequestAsync(fromPetId, toPetId, ct);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("vượt quá giới hạn"))
                {
                    return BadRequest(new { message = ex.Message });
                }
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT /invite/{matchId}
        [HttpPut("invite/{matchId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> UpdateFriendRequest(int matchId, CancellationToken ct = default)
        {
            try
            {
                var result = await _chatUserService.UpdateFriendRequestAsync(matchId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // DELETE /invite/{matchId}
        [HttpDelete("invite/{matchId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> DeleteFriendRequest(int matchId, CancellationToken ct = default)
        {
            try
            {
                var success = await _chatUserService.DeleteFriendRequestAsync(matchId, ct);
                
                if (!success)
                    return NotFound(new { message = "Không tìm thấy yêu cầu kết bạn." });

                return Ok(new { message = "Đã xóa yêu cầu kết bạn." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // DELETE /chat/{matchId}
        [HttpDelete("chat/{matchId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> DeleteChat(int matchId, CancellationToken ct = default)
        {
            try
            {
                var success = await _chatUserService.DeleteChatAsync(matchId, ct);
                
                if (!success)
                    return NotFound(new { message = "Không tìm thấy đoạn chat." });

                return Ok(new { message = "Đã ẩn đoạn chat." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }
    }
}
