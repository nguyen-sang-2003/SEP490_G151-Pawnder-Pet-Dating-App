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
        //[Authorize(Roles = "Admin,User")]
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
                    IsActive = p.IsActive,
                    Description = p.Description,
                    UrlImageAvatar = p.PetPhotos
                        .Where(photo => photo.IsDeleted == false)
                        .OrderByDescending(photo => photo.IsPrimary)
                        .ThenBy(photo => photo.SortOrder)
                        .Select(photo => photo.ImageUrl)
                        .FirstOrDefault()
                })
                .ToListAsync();

            if (pets == null || pets.Count == 0)
                return NotFound(new { Message = "Không tìm thấy thú cưng nào cho người dùng này" });

            return Ok(pets);
        }

        // GET /pet/match/{userId} - Get all pets for matching (exclude current user's pets)
        [HttpGet("match/{userId}")]
        public async Task<IActionResult> GetPetsForMatching(int userId)
        {
            // Get list of users that have any match relationship with current user
            // This includes:
            // 1. Users that current user sent match requests to (FromUserId = userId)
            // 2. Users that sent match requests to current user (ToUserId = userId)
            var sentToUsers = await _context.ChatUsers
                .Where(c => c.FromUserId == userId && c.IsDeleted == false)
                .Select(c => c.ToUserId)
                .ToListAsync();

            var receivedFromUsers = await _context.ChatUsers
                .Where(c => c.ToUserId == userId && c.IsDeleted == false)
                .Select(c => c.FromUserId)
                .ToListAsync();

            // Combine both lists and remove duplicates
            var alreadyMatchedUserIds = sentToUsers.Union(receivedFromUsers).ToList();

            // Get list of users that current user has blocked
            var blockedUserIds = await _context.Blocks
                .Where(b => b.FromUserId == userId)
                .Select(b => b.ToUserId)
                .ToListAsync();

            Console.WriteLine($"[PetController] User {userId} has match relationship with {alreadyMatchedUserIds.Count} users (sent: {sentToUsers.Count}, received: {receivedFromUsers.Count})");
            Console.WriteLine($"[PetController] User {userId} has blocked {blockedUserIds.Count} users");

            var pets = await _context.Pets
                .Include(p => p.PetPhotos)
                .Include(p => p.User)
                    .ThenInclude(u => u.Address)
                .Where(p => p.UserId != null
                         && p.UserId != userId 
                         && p.IsDeleted == false 
                         && p.IsActive == true
                         && !alreadyMatchedUserIds.Contains(p.UserId.Value) // Exclude pets whose owners already received match request
                         && !blockedUserIds.Contains(p.UserId.Value)) // Exclude pets whose owners are blocked by current user
                .Select(p => new
                {
                    PetId = p.PetId,
                    UserId = p.UserId,
                    Name = p.Name,
                    Breed = p.Breed,
                    Gender = p.Gender,
                    Age = p.Age,
                    Description = p.Description,
                    Photos = p.PetPhotos
                        .Where(photo => photo.IsDeleted == false)
                        .OrderByDescending(photo => photo.IsPrimary)
                        .ThenBy(photo => photo.SortOrder)
                        .Select(photo => photo.ImageUrl)
                        .ToList(),
                    Owner = p.User != null ? new
                    {
                        UserId = p.User.UserId,
                        FullName = p.User.FullName,
                        Gender = p.User.Gender,
                        Address = p.User.Address != null ? new
                        {
                            City = p.User.Address.City,
                            District = p.User.Address.District,
                            Latitude = p.User.Address.Latitude,
                            Longitude = p.User.Address.Longitude
                        } : null
                    } : null
                })
                .ToListAsync();

            Console.WriteLine($"[PetController] Returning {pets.Count} available pets for matching");
            return Ok(pets);
        }

        // GET /pet/{petId}
        //[Authorize(Roles = "Admin,User")]
        [HttpGet("{petId}")]
        public async Task<IActionResult> GetPetById(int petId)
        {
            var pet = await _context.Pets
                .Include(p => p.PetPhotos)
                .Include(p => p.PetCharacteristics)
                .Include(p => p.User)
                    .ThenInclude(u => u.Address)
                .Where(p => p.PetId == petId && (p.IsDeleted == false))
                .FirstOrDefaultAsync();

            if (pet == null)
                return NotFound(new { Message = "Không tìm thấy thú cưng" });

            // Build response with owner and address
            var response = new
            {
                PetId = pet.PetId,
                UserId = pet.UserId,
                Name = pet.Name,
                Breed = pet.Breed,
                Gender = pet.Gender,
                Age = pet.Age,
                IsActive = pet.IsActive,
                Description = pet.Description,
                UrlImage = pet.PetPhotos
                    .Where(photo => photo.IsDeleted == false)
                    .OrderByDescending(photo => photo.IsPrimary)
                    .ThenBy(photo => photo.SortOrder)
                    .Select(photo => photo.ImageUrl)
                    .ToList(),
                Owner = pet.User != null ? new
                {
                    UserId = pet.User.UserId,
                    FullName = pet.User.FullName,
                    Email = pet.User.Email,
                    Gender = pet.User.Gender,
                    Address = pet.User.Address != null ? new
                    {
                        AddressId = pet.User.Address.AddressId,
                        City = pet.User.Address.City,
                        District = pet.User.Address.District,
                        Ward = pet.User.Address.Ward,
                        FullAddress = pet.User.Address.FullAddress,
                        Latitude = pet.User.Address.Latitude,
                        Longitude = pet.User.Address.Longitude
                    } : null
                } : null
            };

            return Ok(response);
        }

        // POST /pet
        //[Authorize(Roles = "User")]
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
            pet.IsActive = petDto.IsActive;
            pet.Description = petDto.Description;
            pet.CreatedAt = DateTime.Now;
            pet.UpdatedAt = DateTime.Now;

            _context.Pets.Add(pet);
            await _context.SaveChangesAsync();

            return Ok(new { 
                PetId = pet.PetId,
                UserId = pet.UserId,
                Name = pet.Name,
                Gender = pet.Gender,
                Description = pet.Description,
                IsActive = pet.IsActive,
                CreatedAt = pet.CreatedAt
            });
        }

        // PUT /pet/{petId}
        //[Authorize(Roles = "User")]
        [HttpPut("{petId}")]
        public async Task<IActionResult> UpdatePet(int petId, [FromBody] PetDto_2 updatedPet)
        {
            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted == true)
                return NotFound(new { Message = "Không tìm thấy thú cưng" });

            pet.Name = updatedPet.Name;
            pet.Breed = updatedPet.Breed;
            pet.Gender = updatedPet.Gender;
            pet.Age = updatedPet.Age;
            pet.IsActive = updatedPet.IsActive;
            pet.Description = updatedPet.Description;
            pet.UpdatedAt = DateTime.Now;

            _context.Pets.Update(pet);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật thông tin thú cưng thành công", Pet = pet });
        }

        // DELETE /pet/{petId}
        //[Authorize(Roles = "User")]
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

        // PUT /pet/{petId}/set-active - Set pet as active
        [HttpPut("{petId}/set-active")]
        public async Task<IActionResult> SetActivePet(int petId)
        {
            var pet = await _context.Pets.FindAsync(petId);
            if (pet == null || pet.IsDeleted == true)
                return NotFound(new { Message = "Không tìm thấy thú cưng" });

            // Set all other pets of this user to inactive
            var userId = pet.UserId;
            var userPets = await _context.Pets.Where(p => p.UserId == userId && p.IsDeleted == false).ToListAsync();
            foreach (var p in userPets)
            {
                p.IsActive = (p.PetId == petId);
                p.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã đặt thú cưng làm mặc định", PetId = petId });
        }
    }
}
