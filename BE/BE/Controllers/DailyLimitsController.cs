using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mime;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho DailyLimits - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/daily-limits")]
    [Produces(MediaTypeNames.Application.Json)]
    public class DailyLimitsController : ControllerBase
    {
        private readonly IDailyLimitService _limitService;

        public DailyLimitsController(IDailyLimitService limitService)
        {
            _limitService = limitService;
        }

        // GET /api/daily-limits/{userId}/{actionType}/remaining
        [HttpGet("{userId:int}/{actionType}/remaining")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult> GetRemainingCount(int userId, string actionType, CancellationToken ct = default)
        {
            try
            {
                int remaining = await _limitService.GetRemainingCountAsync(userId, actionType, ct);
                
                return Ok(new
                {
                    success = true,
                    userId = userId,
                    actionType = actionType,
                    remaining = remaining
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi khi lấy số lần còn lại",
                    error = ex.Message
                });
            }
        }
    }
}

