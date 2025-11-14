using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    /// <summary>
    /// Service implementation cho Pet - xử lý business logic
    /// </summary>
    public class PetService : IPetService
    {
        private readonly IPetRepository _petRepository;
        private readonly PawnderDatabaseContext _context;

        public PetService(IPetRepository petRepository, PawnderDatabaseContext context)
        {
            _petRepository = petRepository;
            _context = context;
        }

        public async Task<IEnumerable<PetDto>> GetPetsByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await _petRepository.GetPetsByUserIdAsync(userId, ct);
        }

        public async Task<IEnumerable<object>> GetPetsForMatchingAsync(int userId, CancellationToken ct = default)
        {
            // Business logic: Lấy danh sách users đã match và blocked
            var sentToUsers = await _context.ChatUsers
                .Where(c => c.FromUserId == userId && c.IsDeleted == false)
                .Select(c => c.ToUserId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToListAsync(ct);

            var receivedFromUsers = await _context.ChatUsers
                .Where(c => c.ToUserId == userId && c.IsDeleted == false)
                .Select(c => c.FromUserId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToListAsync(ct);

            var alreadyMatchedUserIds = sentToUsers.Union(receivedFromUsers).ToList();

            var blockedUserIds = await _context.Blocks
                .Where(b => b.FromUserId == userId)
                .Select(b => b.ToUserId)
                .ToListAsync(ct);

            Console.WriteLine($"[PetService] User {userId} has match relationship with {alreadyMatchedUserIds.Count} users");
            Console.WriteLine($"[PetService] User {userId} has blocked {blockedUserIds.Count} users");

            var pets = await _petRepository.GetPetsForMatchingAsync(userId, alreadyMatchedUserIds, blockedUserIds, ct);

            Console.WriteLine($"[PetService] Returning {pets.Count()} available pets for matching");
            return pets;
        }

        public async Task<object?> GetPetByIdAsync(int petId, CancellationToken ct = default)
        {
            var pet = await _petRepository.GetPetByIdWithDetailsAsync(petId, ct);

            if (pet == null)
                return null;

            // Business logic: Build response với owner và address
            return new
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
                    .OrderBy(photo => photo.SortOrder)
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
        }

        public async Task<object> CreatePetAsync(PetDto_2 petDto, CancellationToken ct = default)
        {
            // Business logic: Validate và tạo pet
            if (petDto == null)
                throw new ArgumentNullException(nameof(petDto), "Dữ liệu thú cưng không hợp lệ");

            var pet = new Pet
            {
                UserId = petDto.UserId,
                Name = petDto.Name,
                Breed = petDto.Breed,
                Gender = petDto.Gender,
                Age = petDto.Age,
                IsActive = petDto.IsActive,
                Description = petDto.Description,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _petRepository.AddAsync(pet, ct);

            return new
            {
                PetId = pet.PetId,
                UserId = pet.UserId,
                Name = pet.Name,
                Gender = pet.Gender,
                Description = pet.Description,
                IsActive = pet.IsActive,
                CreatedAt = pet.CreatedAt
            };
        }

        public async Task<object> UpdatePetAsync(int petId, PetDto_2 updatedPet, CancellationToken ct = default)
        {
            var pet = await _petRepository.GetByIdAsync(petId, ct);
            if (pet == null || pet.IsDeleted == true)
                throw new KeyNotFoundException("Không tìm thấy thú cưng");

            // Business logic: Update pet
            pet.Name = updatedPet.Name;
            pet.Breed = updatedPet.Breed;
            pet.Gender = updatedPet.Gender;
            pet.Age = updatedPet.Age;
            pet.IsActive = updatedPet.IsActive;
            pet.Description = updatedPet.Description;
            pet.UpdatedAt = DateTime.Now;

            await _petRepository.UpdateAsync(pet, ct);

            return new { Message = "Cập nhật thông tin thú cưng thành công", Pet = pet };
        }

        public async Task<bool> DeletePetAsync(int petId, CancellationToken ct = default)
        {
            var pet = await _petRepository.GetByIdAsync(petId, ct);
            if (pet == null)
                return false;

            // Business logic: Soft delete
            pet.IsDeleted = true;
            pet.UpdatedAt = DateTime.Now;

            await _petRepository.UpdateAsync(pet, ct);
            return true;
        }

        public async Task<bool> SetActivePetAsync(int petId, CancellationToken ct = default)
        {
            var pet = await _petRepository.GetByIdAsync(petId, ct);
            if (pet == null || pet.IsDeleted == true)
                return false;

            // Business logic: Set active và deactivate các pet khác
            if (pet.UserId.HasValue)
            {
                await _petRepository.DeactivateOtherPetsAsync(pet.UserId.Value, petId, ct);
            }

            return true;
        }
    }
}

