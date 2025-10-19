using BE.DTO;
using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Drawing;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PetController : Controller
    {
        private readonly PawnderDatabaseContext _context;
        public PetController(PawnderDatabaseContext context)
        {
            _context = context;
        }

        // GET /pet/user/{userId}
        [Authorize(Roles = "Admin,User")]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetPetsByUser(int userId)
        {
            var pets = await _context.Pets
                .Include(p => p.PetPhotos)
                .Where(p => p.UserId == userId && (p.IsDeleted == false))
                .Select(p => new PetDto
                {
                    PetId = p.PetId,
                    Name = p.Name,
                    Breed = p.Breed,
                    Gender = p.Gender,
                    Age = p.Age,
                    IsDeadted = p.IsDeadted,
                    Description = p.Description,
                    UrlImageAvatar = p.PetPhotos.Select(photo => photo.ImageUrl).FirstOrDefault()
                })
                .ToListAsync();

            if (pets == null || pets.Count == 0)
                return NotFound(new { Message = "Không tìm thấy thú cưng nào cho người dùng này" });

            return Ok(pets);
        }

        // GET /pet/{petId}
        [Authorize(Roles = "Admin,User")]
        [HttpGet("{petId}")]
        public async Task<IActionResult> GetPetById(int petId)
        {
            var pet = await _context.Pets
                .Include(p => p.PetPhotos)
                .Include(p => p.PetCharacteristics)
                .Where(p => p.PetId == petId && (p.IsDeleted == false))
                .Select(p => new PetDto_1
                {
                    PetId = p.PetId,
                    Name = p.Name,
                    Breed = p.Breed,
                    Gender = p.Gender,
                    Age = p.Age,
                    IsDeadted = p.IsDeadted,
                    Description = p.Description,
                    UrlImage = p.PetPhotos.Select(photo => photo.ImageUrl).ToList()
                }).FirstOrDefaultAsync();

            if (pet == null)
                return NotFound(new { Message = "Không tìm thấy thú cưng" });

            return Ok(pet);
        }

        // POST /pet
        [Authorize(Roles = "User")]
        [HttpPost]
        public async Task<IActionResult> CreatePet([FromBody] PetDto_2 petDto)
        {
            if (petDto == null)
                return BadRequest(new { Message = "Dữ liệu thú cưng không hợp lệ" });

            Pet pet = new Pet();

            pet.UserId = petDto.UserId;
            pet.Name = petDto.Name;
            pet.Breed = petDto.Breed;
            pet.Gender = petDto.Gender;
            pet.Age = petDto.Age;
            pet.IsDeadted = petDto.IsDeadted;
            pet.Description = petDto.Description;
            pet.CreatedAt = DateTime.Now;
            pet.UpdatedAt = DateTime.Now;

            _context.Pets.Add(pet);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPetById), new { petId = pet.PetId }, pet);
        }

        // PUT /pet/{petId}
        [Authorize(Roles = "User")]
        [HttpPut("{petId}")]
        public async Task<IActionResult> UpdatePet(int petId, [FromBody] PetDto_2 updatedPet)
        {
            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted == false)
                return NotFound(new { Message = "Không tìm thấy thú cưng" });

            pet.Name = updatedPet.Name;
            pet.Breed = updatedPet.Breed;
            pet.Gender = updatedPet.Gender;
            pet.Age = updatedPet.Age;
            pet.IsDeadted = updatedPet.IsDeadted;
            pet.Description = updatedPet.Description;
            pet.UpdatedAt = DateTime.Now;

            _context.Pets.Update(pet);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật thông tin thú cưng thành công", Pet = pet });
        }

        // DELETE /pet/{petId}
        [Authorize(Roles = "User")]
        [HttpDelete("{petId}")]
        public async Task<IActionResult> DeletePet(int petId)
        {
            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null)
                return NotFound(new { Message = "Không tìm thấy thú cưng" });

            pet.IsDeleted = true;
            pet.UpdatedAt = DateTime.Now;

            _context.Pets.Update(pet);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Xóa thú cưng thành công"});
        }
    }
}
