using BE.Models;
using BE.Services;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PetCharacteristicController : Controller
    {
        private readonly PawnderDatabaseContext _context;
        public readonly Validate _validate = new Validate();
        public PetCharacteristicController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // GET /pet-characteristic/{petId}
        [Authorize(Roles = "Admin,User")]
        [HttpGet("{petId}")]
        public async Task<IActionResult> GetCharacteristicsByPet(int petId)
        {
            var characteristics = await _context.Petcharacteristics
                .Include(pc => pc.Attribute)
                .Where(pc => pc.PetId == petId && pc.Attribute.IsDeleted == false)
                .Select(pc => new
                {
                    pc.AttributeId,
                    AttributeName = pc.Attribute.Name,
                    pc.Value,
                    pc.Attribute.Unit,
                    pc.Attribute.TypeValue
                })
                .OrderBy(pc => pc.AttributeId)
                .ToListAsync();

            if (!characteristics.Any())
                return NotFound(new { Message = "Không tìm thấy đặc điểm nào cho pet này." });

            return Ok(characteristics);
        }

        // POST /pet-characteristic/{petId}/{attributeId}
        [Authorize(Roles = "User")]
        [HttpPost("{petId:int}/{attributeId:int}")]
        public async Task<IActionResult> CreatePetCharacteristic(int petId, int attributeId, [FromBody] string Value)
        {
            if (string.IsNullOrWhiteSpace(Value)) return BadRequest("NewValue không được để trống.");

            var petExists = await _context.Pets.AnyAsync(p => p.PetId == petId);
            if (!petExists)
                return NotFound(new { Message = "Không tìm thấy thú cưng." });

            var attribute = await _context.Attributes.FirstOrDefaultAsync(a => a.Attributeid == attributeId);
            if (attribute == null || attribute.IsDeleted != false)
                return NotFound(new { Message = "Thuộc tính không tồn tại hoặc đã bị xóa." });

            var exists = await _context.Petcharacteristics
                .AnyAsync(pc => pc.PetId == petId && pc.AttributeId == attributeId);
            if (exists)
                return Conflict(new { Message = "Đặc điểm này đã tồn tại cho pet." });

            if (!_validate.IsValidValueByType(Value, attribute.TypeValue))
            {
                return BadRequest(new
                {
                    Message = $"Giá trị '{Value}' không hợp lệ cho kiểu '{attribute.TypeValue}'."
                });
            }

            var characteristic = new PetCharacteristic
            {
                PetId = petId,
                AttributeId = attributeId,
                Value = Value,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Petcharacteristics.Add(characteristic);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Tạo mới đặc điểm thành công." });
        }

        // PUT /pet-characteristic/{petId}/{attributeId}
        [Authorize(Roles = "User")]
        [HttpPut("{petId:int}/{attributeId:int}")]
        public async Task<IActionResult> UpdatePetCharacteristic(int petId, int attributeId, [FromBody] string NewValue)
        {
            if (string.IsNullOrWhiteSpace(NewValue)) return BadRequest("NewValue không được để trống."); 

            var characteristic = await _context.Petcharacteristics
                .Include(pc => pc.Attribute)
                .FirstOrDefaultAsync(pc => pc.PetId == petId && pc.AttributeId == attributeId);

            if (characteristic == null)
                return NotFound(new { Message = "Không tìm thấy đặc điểm cần cập nhật." });

            if (characteristic.Attribute.IsDeleted != false)
                return BadRequest(new { Message = "Thuộc tính này đã bị xóa, không thể cập nhật." });

            if (!_validate.IsValidValueByType(NewValue, characteristic.Attribute.TypeValue))
            {
                return BadRequest(new
                {
                    Message = $"Giá trị '{NewValue}' không hợp lệ cho kiểu '{characteristic.Attribute.TypeValue}'."
                });
            }

            characteristic.Value = NewValue;
            characteristic.UpdatedAt = DateTime.Now;

            _context.Petcharacteristics.Update(characteristic);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật đặc điểm thành công."});
        }
    }
}
