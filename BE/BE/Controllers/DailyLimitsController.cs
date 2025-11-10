using BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mime;
using System.Security.Claims;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/daily-limits")]
    [Produces(MediaTypeNames.Application.Json)]
    public class DailyLimitsController : ControllerBase
    {
        private readonly DailyLimitService _limitService;

        public DailyLimitsController(DailyLimitService limitService)
        {
            _limitService = limitService;
        }

        // GET /api/daily-limits/{userId}/{actionType}/remaining
        // Lấy số lần còn lại cho action type cụ thể
        [HttpGet("{userId:int}/{actionType}/remaining")]
        public async Task<ActionResult> GetRemainingCount(int userId, string actionType)
        {
            try
            {
                int remaining = await _limitService.GetRemainingCount(userId, actionType);
                
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

