using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho Match - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class MatchController : Controller
    {
        private readonly IMatchService _matchService;

        public MatchController(IMatchService matchService)
        {
            _matchService = matchService;
        }

        // GET /api/match/likes-received/{userId}?petId={petId}
        [HttpGet("likes-received/{userId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetLikesReceived(int userId, [FromQuery] int? petId = null, CancellationToken ct = default)
        {
            try
            {
                var result = await _matchService.GetLikesReceivedAsync(userId, petId, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching likes", error = ex.Message });
            }
        }

        // GET /api/match/stats/{userId}
        [HttpGet("stats/{userId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetStats(int userId, CancellationToken ct = default)
        {
            try
            {
                var result = await _matchService.GetStatsAsync(userId, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching stats", error = ex.Message });
            }
        }

        // POST /api/match/like
        [HttpPost("like")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> SendLike([FromBody] LikeRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _matchService.SendLikeAsync(request, ct);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("hết lượt"))
                {
                    return StatusCode(429, new
                    {
                        message = ex.Message,
                        actionType = "request_match"
                    });
                }
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error sending like", error = ex.Message });
            }
        }

        // PUT /api/match/respond
        [HttpPut("respond")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> RespondToLike([FromBody] RespondRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _matchService.RespondToLikeAsync(request, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error responding to like", error = ex.Message });
            }
        }

        // GET /api/match/badge-counts/{userId}?petId={petId}
        [HttpGet("badge-counts/{userId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetBadgeCounts(int userId, [FromQuery] int? petId = null, CancellationToken ct = default)
        {
            try
            {
                var result = await _matchService.GetBadgeCountsAsync(userId, petId, ct);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching badge counts", error = ex.Message });
            }
        }
    }
}
