using BE.DTO;
using BE.Models;
using BE.Services;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.Options;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PetCharacteristicController : Controller
    {
        private readonly PawnderDatabaseContext _context;
        
        public PetCharacteristicController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // GET /pet-characteristic/{petId}
        [HttpGet("pet-characteristic/{petId}")]
        public async Task<IActionResult> GetPetCharacteristics(int petId)
        {
            var characteristics = await _context.PetCharacteristics
                .Include(pc => pc.Attribute)
                .Include(pc => pc.Option)
                .Where(pc => pc.PetId == petId)
                .Select(pc => new
                {
                    attributeId = pc.AttributeId,
                    name = pc.Attribute.Name,
                    optionValue = pc.Option != null ? pc.Option.Name : null,
                    value = pc.Value,
                    unit = pc.Attribute.Unit,
                    typeValue = pc.Attribute.TypeValue,
                })
                .ToListAsync();

            return Ok(characteristics);
        }

        // POST /pet-characteristic/{petId}/{attributeId}
        [HttpPost("pet-characteristic/{petId}/{attributeId}")]
        public async Task<IActionResult> CreatePetCharacteristic(int petId, int attributeId, [FromBody] PetCharacteristicDTO dto)
        {
            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted != false)
                return NotFound(new { message = "Pet không tồn tại." });

            var attribute = await _context.Attributes
                .Include(a => a.AttributeOptions)
                .FirstOrDefaultAsync(a => a.AttributeId == attributeId);
            if (attribute == null || attribute.IsDeleted != false)
                return NotFound(new { message = "Attribute không tồn tại." });

            var existing = await _context.PetCharacteristics
                .FirstOrDefaultAsync(pc => pc.PetId == petId && pc.AttributeId == attributeId);
            if (existing != null)
                return BadRequest(new { message = "Đặc điểm này đã tồn tại cho pet." });

            var petChar = new PetCharacteristic
            {
                PetId = petId,
                AttributeId = attributeId,
                OptionId = dto.OptionId > 0 ? dto.OptionId : null,
                Value = dto.Value > 0 ? dto.Value : null,
                UpdatedAt = DateTime.Now,
                CreatedAt = DateTime.Now
            };

            _context.PetCharacteristics.Add(petChar);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                attributeId = attribute.AttributeId,
                name = attribute.Name,
                typeValue = attribute.TypeValue,
                unit = attribute.Unit,
                value = petChar.Value,
                optionValue = petChar.OptionId != null
                    ? attribute.AttributeOptions.FirstOrDefault(o => o.OptionId == petChar.OptionId)?.Name
                    : null
            });
        }

        // PUT /pet-characteristic/{petId}/{attributeId}
        [HttpPut("pet-characteristic/{petId}/{attributeId}")]
        public async Task<IActionResult> UpdatePetCharacteristic(int petId, int attributeId, [FromBody] PetCharacteristicDTO dto)
        {

            var petChar = await _context.PetCharacteristics
                .Include(pc => pc.Attribute)
                .Include(pc => pc.Option)
                .FirstOrDefaultAsync(pc => pc.PetId == petId && pc.AttributeId == attributeId);

            if (petChar == null)
            {
                return NotFound(new { message = "Đặc điểm này chưa tồn tại cho pet." });
            }

            if (dto.Value != 0)
            {
                petChar.Value = dto.Value; 
            }
            else petChar.Value = null;

            string? optionValueString = null;
            if (dto.OptionId != 0)
            {
                var exitOptionAttribute = await _context.AttributeOptions.FirstOrDefaultAsync(op => op.OptionId == dto.OptionId && op.IsDeleted == false);
                if (exitOptionAttribute == null)
                {
                    return BadRequest(new { message = "Option không tồn tại hoặc đã bị xóa." });
                }
                optionValueString = exitOptionAttribute.Name;
                petChar.OptionId = dto.OptionId;
            }
            else petChar.OptionId = null;

            petChar.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            var result = new
            {
                attributeId = petChar.AttributeId,
                name = petChar.Attribute.Name,
                optionValue = petChar.OptionId != null ? optionValueString : null,
                value = petChar.Value,
                unit = petChar.Attribute.Unit,
                typeValue = petChar.Attribute.TypeValue,
            };

            return Ok(result);
        }

    }
}
