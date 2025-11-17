using BE.DTO;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controllers
{
    /// <summary>
    /// Controller cho Pet - chỉ nhận request và trả response, không có business logic
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PetController : ControllerBase
    {
        private readonly IPetService _petService;

        public PetController(IPetService petService)
        {
            _petService = petService;
        }

        // GET /pet/user/{userId}
        [HttpGet("user/{userId}")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> GetPetsByUser(int userId, CancellationToken ct = default)
        {
            try
            {
                var pets = await _petService.GetPetsByUserIdAsync(userId, ct);

                if (pets == null || !pets.Any())
                    return NotFound(new { Message = "Không tìm thấy thú cưng nào cho người dùng này" });

                return Ok(pets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /pet/match/{userId} - Get all pets for matching
        [HttpGet("match/{userId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetPetsForMatching(int userId, CancellationToken ct = default)
        {
            try
            {
                var pets = await _petService.GetPetsForMatchingAsync(userId, ct);
                return Ok(pets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // GET /pet/{petId}
        [HttpGet("{petId}")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> GetPetById(int petId, CancellationToken ct = default)
        {
            try
            {
                var pet = await _petService.GetPetByIdAsync(petId, ct);

                if (pet == null)
                    return NotFound(new { Message = "Không tìm thấy thú cưng" });

                return Ok(pet);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // POST /pet
        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> CreatePet([FromBody] PetDto_2 petDto, CancellationToken ct = default)
        {
            try
            {
                var result = await _petService.CreatePetAsync(petDto, ct);
                return Ok(result);
            }
            catch (ArgumentNullException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT /pet/{petId}
        [HttpPut("{petId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> UpdatePet(int petId, [FromBody] PetDto_2 updatedPet, CancellationToken ct = default)
        {
            try
            {
                var result = await _petService.UpdatePetAsync(petId, updatedPet, ct);
                return Ok(result);
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

        // DELETE /pet/{petId}
        [HttpDelete("{petId}")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> DeletePet(int petId, CancellationToken ct = default)
        {
            try
            {
                var success = await _petService.DeletePetAsync(petId, ct);

                if (!success)
                    return NotFound(new { Message = "Không tìm thấy thú cưng" });

                return Ok(new { Message = "Xóa thú cưng thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }

        // PUT /pet/{petId}/set-active - Set pet as active
        [HttpPut("{petId}/set-active")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> SetActivePet(int petId, CancellationToken ct = default)
        {
            try
            {
                var success = await _petService.SetActivePetAsync(petId, ct);

                if (!success)
                    return NotFound(new { Message = "Không tìm thấy thú cưng" });

                return Ok(new { Message = "Đã đặt thú cưng làm mặc định", PetId = petId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Lỗi hệ thống", Error = ex.Message });
            }
        }
    }
}
