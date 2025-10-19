using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BE.DTO;
using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Alias để tránh đụng System.Attribute
using AttributeEntity = BE.Models.Attribute;

namespace BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttributesController : ControllerBase
    {
        private readonly PawnderDatabaseContext _context;

        public AttributesController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // GET: api/Attributes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AttributesDTO>>> GetAttributes()
        {
            var items = await _context.Attributes
                .Select(e => MapToDto(e))
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/Attributes/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<AttributesDTO>> GetAttribute(int id)
        {
            var entity = await _context.Attributes.FindAsync(id);
            if (entity == null) return NotFound();

            return Ok(MapToDto(entity));
        }

        // POST: api/Attributes
        // Body: AttributesDTO (không set Attributeid/Createdat/Updatedat từ client)
        [HttpPost]
        public async Task<ActionResult<AttributesDTO>> PostAttribute([FromBody] AttributesDTO dto)
        {
            if (dto == null) return BadRequest();

            var entity = new AttributeEntity
            {
                // Attributeid để DB tự sinh (nếu là identity/sequence)
                Name = dto.Name,
                TypeValue = dto.Typevalue,
                Unit = dto.Unit
                // Createdat/Updatedat để DB/SaveChanges xử lý
            };

            _context.Attributes.Add(entity);
            await _context.SaveChangesAsync();

            var resultDto = MapToDto(entity);
            return CreatedAtAction(nameof(GetAttribute), new { id = entity.AttributeId }, resultDto);
        }

        // PUT: api/Attributes/5
        // Body: AttributesDTO (chỉ cập nhật Name/Typevalue/Unit)
        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutAttribute(int id, [FromBody] AttributesDTO dto)
        {
            if (dto == null ) return BadRequest();

            var entity = await _context.Attributes.FirstOrDefaultAsync(a => a.AttributeId == id);
            if (entity == null) return NotFound();

            // Chỉ update các trường cho phép (tránh overposting)
            entity.Name = dto.Name;
            entity.TypeValue = dto.Typevalue;
            entity.Unit = dto.Unit;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AttributeExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Attributes/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAttribute(int id)
        {
            var entity = await _context.Attributes.FindAsync(id);
            if (entity == null) return NotFound();

            _context.Attributes.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static AttributesDTO MapToDto(AttributeEntity e) => new AttributesDTO
        {
            Attributeid = e.AttributeId,
            Name = e.Name,
            Typevalue = e.TypeValue,
            Unit = e.Unit,
            Createdat = e.CreatedAt,
            Updatedat = e.UpdatedAt
        };

        private bool AttributeExists(int id)
            => _context.Attributes.Any(e => e.AttributeId == id);
    }
}
