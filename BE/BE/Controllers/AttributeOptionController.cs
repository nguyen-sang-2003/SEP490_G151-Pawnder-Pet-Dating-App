using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttributeOptionController : Controller
    {
        private readonly PawnderDatabaseContext _context;

        public AttributeOptionController(PawnderDatabaseContext context)
        {
            _context = context;
        }
        // GET /attribute-option
        [HttpGet("attribute-option")]
        public async Task<IActionResult> GetAllOptions()
        {
            var options = await _context.AttributeOptions
                .Where(o => o.IsDeleted == false)
                .Select(o => new OptionResponse
                {
                    OptionId = o.OptionId,
                    AttributeId = o.AttributeId,
                    Name = o.Name,
                    IsDeleted = o.IsDeleted
                })
                .ToListAsync();

            return Ok(options);
        }

        // POST /attribute-option/{AttributeId}
        [HttpPost("attribute-option/{attributeId}")]
        public async Task<IActionResult> CreateOption(int attributeId, [FromBody] string optionName)
        {
            if (string.IsNullOrWhiteSpace(optionName))
                return BadRequest(new { message = "Tên option không được để trống." });

            var attribute = await _context.Attributes.FindAsync(attributeId);
            if (attribute == null || attribute.IsDeleted != false )
                return NotFound(new { message = "Không tìm thấy attribute tương ứng." });

            var newOption = new AttributeOption
            {
                AttributeId = attributeId,
                Name = optionName.Trim(),
                IsDeleted = false,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.AttributeOptions.Add(newOption);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo option thành công."
            });
        }

        // PUT /attribute-option/{optionId}
        [HttpPut("attribute-option/{optionId}")]
        public async Task<IActionResult> UpdateOptions(int optionId, [FromBody] string optionNames)
        {

            if (optionNames == null)
                return BadRequest(new { message = "Option không được để trống." });

            var exitOption = await _context.AttributeOptions.FindAsync(optionId);
            if(exitOption == null || exitOption.IsDeleted != false)
            {
                return NotFound(new { message = "Không tìm thấy option tương ứng." });
            }

            exitOption.Name = optionNames.Trim();
            exitOption.UpdatedAt = DateTime.Now;

            _context.AttributeOptions.Update(exitOption);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật danh sách option thành công." });
        }

        // DELETE /attribute-option/{OptionId}
        [HttpDelete("attribute-option/{optionId}")]
        public async Task<IActionResult> DeleteOption(int optionId)
        {
            var option = await _context.AttributeOptions.FindAsync(optionId);
            if (option == null || option.IsDeleted != false)
                return NotFound(new { message = "Không tìm thấy option." });

            option.IsDeleted = true;
            option.UpdatedAt = DateTime.Now;

            _context.AttributeOptions.Update(option);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa option thành công." });
        }

    }
}
