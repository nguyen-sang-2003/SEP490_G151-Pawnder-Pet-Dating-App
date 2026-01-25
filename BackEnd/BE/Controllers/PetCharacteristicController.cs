using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho PetCharacteristic - chỉ nhận request và trả response
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PetCharacteristicController : Controller
    {
        private readonly IPetCharacteristicService _petCharacteristicService;

        public PetCharacteristicController(IPetCharacteristicService petCharacteristicService)
        {
            _petCharacteristicService = petCharacteristicService;
        }

        // GET /pet-characteristic/{petId}
        [HttpGet("pet-characteristic/{petId}")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> GetPetCharacteristics(int petId, CancellationToken ct = default)
        {
            try
            {
                var characteristics = await _petCharacteristicService.GetPetCharacteristicsAsync(petId, ct);
                return Ok(characteristics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /pet-characteristic/{petId}/{attributeId}
        [HttpPost("pet-characteristic/{petId}/{attributeId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> CreatePetCharacteristic(int petId, int attributeId, [FromBody] PetCharacteristicDTO dto, CancellationToken ct = default)
        {
            try
            {
                var result = await _petCharacteristicService.CreatePetCharacteristicAsync(petId, attributeId, dto, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }

        // PUT /pet-characteristic/{petId}/{attributeId}
        [HttpPut("pet-characteristic/{petId}/{attributeId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> UpdatePetCharacteristic(int petId, int attributeId, [FromBody] PetCharacteristicDTO dto, CancellationToken ct = default)
        {
            try
            {
                var result = await _petCharacteristicService.UpdatePetCharacteristicAsync(petId, attributeId, dto, ct);
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
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }
    }
}
