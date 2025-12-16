using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho PetRecommendation - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PetRecommendationController : ControllerBase
    {
        private readonly IPetRecommendationService _petRecommendationService;

        public PetRecommendationController(IPetRecommendationService petRecommendationService)
        {
            _petRecommendationService = petRecommendationService;
        }

        [HttpGet("{userId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> RecommendPets(int userId, CancellationToken ct = default)
        {
            try
            {
                var result = await _petRecommendationService.RecommendPetsAsync(userId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }

        [HttpGet("pet/{preferenceUserId}/{targetPetId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> RecommendPetsForPet(int preferenceUserId, int targetPetId, CancellationToken ct = default)
        {
            try
            {
                var result = await _petRecommendationService.RecommendPetsForPetAsync(preferenceUserId, targetPetId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }
    }
}
