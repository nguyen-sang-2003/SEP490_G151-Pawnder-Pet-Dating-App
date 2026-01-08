using BE.Services.Interfaces;
using BE.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho ChatAI - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/chat-ai")]
    [Authorize(Roles = "User,Admin,Expert")]
    public class ChatAIController : ControllerBase
    {
        private readonly IChatAIService _chatAIService;

        public ChatAIController(IChatAIService chatAIService)
        {
            _chatAIService = chatAIService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                return int.Parse(userIdClaim);
            }
            return 0;
        }

        // GET: /api/chat-ai/token-usage
        [HttpGet("token-usage")]
        public async Task<IActionResult> GetTokenUsage(CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var data = await _chatAIService.GetTokenUsageAsync(userId, ct);
                return Ok(new { success = true, data = data });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: /api/chat-ai/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetAllChats(int userId, CancellationToken ct = default)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                if (currentUserId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                
                if (currentUserId != userId)
                    return Forbid();

                var chats = await _chatAIService.GetAllChatsAsync(userId, ct);
                return Ok(new { success = true, data = chats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /api/chat-ai/{userId}
        [HttpPost("{userId}")]
        public async Task<IActionResult> CreateChat(int userId, [FromBody] CreateChatRequest request, CancellationToken ct = default)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                if (currentUserId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });
                
                if (currentUserId != userId)
                    return Forbid();

                var data = await _chatAIService.CreateChatAsync(userId, request.Title, ct);
                return Ok(new
                {
                    success = true,
                    data = data,
                    message = "Tạo cuộc trò chuyện thành công"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // PUT: /api/chat-ai/{chatAiId}
        [HttpPut("{chatAiId}")]
        public async Task<IActionResult> UpdateChatTitle(int chatAiId, [FromBody] UpdateChatTitleRequest request, CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _chatAIService.UpdateChatTitleAsync(chatAiId, userId, request.Title, ct);
                return Ok(new { success = true, message = "Cập nhật tiêu đề thành công" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DELETE: /api/chat-ai/{chatAiId}
        [HttpDelete("{chatAiId}")]
        public async Task<IActionResult> DeleteChat(int chatAiId, CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserId();
                var success = await _chatAIService.DeleteChatAsync(chatAiId, userId, ct);
                return Ok(new { success = true, message = "Xóa cuộc trò chuyện thành công" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        // GET: /api/chat-ai/{chatAiId}/messages
        [HttpGet("{chatAiId}/messages")]
        public async Task<IActionResult> GetChatHistory(int chatAiId, CancellationToken ct = default)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (userId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                // Check if user is Expert or Admin - allow them to view any chat
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var effectiveUserId = (userRole == "Expert" || userRole == "Admin") ? 0 : userId;

                var data = await _chatAIService.GetChatHistoryAsync(chatAiId, effectiveUserId, ct);
                return Ok(new { success = true, data = data });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /api/chat-ai/{chatAiId}/messages
        [HttpPost("{chatAiId}/messages")]
        public async Task<IActionResult> SendMessage(int chatAiId, [FromBody] SendMessageRequest request, CancellationToken ct = default)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"[API] Received AI message request - ChatId: {chatAiId}, UserId: {userId}, Question length: {request.Question?.Length ?? 0}");

                if (string.IsNullOrWhiteSpace(request.Question))
                {
                    return BadRequest(new { success = false, message = "Câu hỏi không được để trống" });
                }

                var data = await _chatAIService.SendMessageAsync(chatAiId, userId, request.Question, ct);
                
                stopwatch.Stop();
                Console.WriteLine($"[API] AI message processed successfully in {stopwatch.ElapsedMilliseconds}ms");
                
                return Ok(new
                {
                    success = true,
                    data = data
                });
            }
            catch (QuotaExceededException ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"[API] Quota exceeded after {stopwatch.ElapsedMilliseconds}ms: {ex.Message}");
                
                // Trả về 429 với đầy đủ usage info
                return StatusCode(429, new
                {
                    success = false,
                    message = ex.Message,
                    actionType = "ai_chat_question",
                    usage = new
                    {
                        isVip = ex.IsVip,
                        dailyQuota = ex.DailyQuota,
                        tokensUsed = ex.TokensUsed,
                        tokensRemaining = ex.TokensRemaining
                    }
                });
            }
            catch (ArgumentException ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"[API] Bad request after {stopwatch.ElapsedMilliseconds}ms: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"[API] Invalid operation after {stopwatch.ElapsedMilliseconds}ms: {ex.Message}");
                
                if (ex.Message.Contains("hết lượt"))
                {
                    return StatusCode(429, new
                    {
                        success = false,
                        message = ex.Message,
                        actionType = "ai_chat_question"
                    });
                }
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                Console.WriteLine($"[API] Error after {stopwatch.ElapsedMilliseconds}ms: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                if (ex.Message.Contains("not found") || ex.Message.Contains("access denied"))
                {
                    return NotFound(new { success = false, message = ex.Message });
                }
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Clone an existing AI chat for Expert to continue the conversation
        /// POST: /api/chat-ai/clone/{originalChatAiId}
        /// </summary>
        [HttpPost("clone/{originalChatAiId}")]
        [Authorize(Roles = "Expert,Admin")]
        public async Task<IActionResult> CloneChatForExpert(int originalChatAiId, CancellationToken ct = default)
        {
            try
            {
                var expertId = GetCurrentUserId();
                
                if (expertId == 0)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                Console.WriteLine($"[API] Expert {expertId} cloning chat {originalChatAiId}");

                var data = await _chatAIService.CloneChatForExpertAsync(originalChatAiId, expertId, ct);
                
                Console.WriteLine($"[API] Chat cloned successfully");
                
                return Ok(new
                {
                    success = true,
                    data = data,
                    message = "Đã tạo bản sao cuộc trò chuyện thành công"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[API] Clone chat error: {ex.Message}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // DTOs
    public class CreateChatRequest
    {
        public string? Title { get; set; }
    }

    public class UpdateChatTitleRequest
    {
        public string Title { get; set; } = null!;
    }

    public class SendMessageRequest
    {
        public string Question { get; set; } = null!;
    }
}
