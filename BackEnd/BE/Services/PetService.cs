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
            var userPetIds = await _context.Pets
                .Where(p => p.UserId == userId && p.IsDeleted == false)
                .Select(p => p.PetId)
                .ToListAsync(ct);

            var sentToUsers = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c => c.IsDeleted == false 
                           && c.FromPet != null && c.ToPet != null
                           && userPetIds.Contains(c.FromPetId ?? -1))
                .Select(c => c.ToPet!.UserId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToListAsync(ct);

            var receivedFromUsers = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c => c.IsDeleted == false 
                           && c.FromPet != null && c.ToPet != null
                           && userPetIds.Contains(c.ToPetId ?? -1))
                .Select(c => c.FromPet!.UserId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
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

            // Business logic: Get Age from PetCharacteristic only
            int? age = null;
            var ageChar = pet.PetCharacteristics
                .FirstOrDefault(pc => pc.Attribute != null &&
                                     (pc.Attribute.Name.ToLower() == "tuổi" ||
                                      pc.Attribute.Name.ToLower() == "age"));
            if (ageChar != null && ageChar.Value.HasValue)
            {
                age = (int)Math.Round((double)ageChar.Value.Value);
            }

            // Business logic: Build response với owner và address
            return new
            {
                PetId = pet.PetId,
                UserId = pet.UserId,
                Name = pet.Name,
                Breed = pet.Breed,
                Gender = pet.Gender,
                Age = age,
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

            // Validation: Tên pet bắt buộc, 2-50 ký tự
            if (string.IsNullOrWhiteSpace(petDto.Name))
                throw new ArgumentException("Tên thú cưng là bắt buộc.");
            
            var petName = petDto.Name.Trim();
            if (petName.Length < 2 || petName.Length > 50)
                throw new ArgumentException("Tên thú cưng phải từ 2 đến 50 ký tự.");

            // Validation: Giống loài bắt buộc
            if (string.IsNullOrWhiteSpace(petDto.Breed))
                throw new ArgumentException("Giống loài là bắt buộc.");

            // Validation: Giới tính bắt buộc và hợp lệ
            if (string.IsNullOrWhiteSpace(petDto.Gender))
                throw new ArgumentException("Giới tính là bắt buộc.");
            
            var validGenders = new[] { "Đực", "Cái", "Male", "Female" };
            if (!validGenders.Contains(petDto.Gender, StringComparer.OrdinalIgnoreCase))
                throw new ArgumentException("Giới tính phải là 'Đực' hoặc 'Cái'.");

            // Validation: Mô tả tối đa 500 ký tự
            if (!string.IsNullOrEmpty(petDto.Description) && petDto.Description.Length > 500)
                throw new ArgumentException("Mô tả không được quá 500 ký tự.");

            // Business logic: BR-02 - Giới hạn tối đa 3 pet/user
            if (petDto.UserId > 0)
            {
                var currentPetCount = await _context.Pets
                    .CountAsync(p => p.UserId == petDto.UserId && p.IsDeleted != true, ct);
                
                if (currentPetCount >= 3)
                    throw new InvalidOperationException("Mỗi người dùng chỉ được tạo tối đa 3 thú cưng.");
            }

            var pet = new Pet
            {
                UserId = petDto.UserId,
                Name = petName,
                Breed = petDto.Breed.Trim(),
                Gender = petDto.Gender,
                IsActive = petDto.IsActive,
                Description = petDto.Description?.Trim(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _petRepository.AddAsync(pet, ct);

            // Business logic: If this pet is set as active, deactivate all other pets for this user
            if (pet.IsActive == true && pet.UserId.HasValue)
            {
                await _petRepository.DeactivateOtherPetsAsync(pet.UserId.Value, pet.PetId, ct);
            }

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

            // Validation: Tên pet bắt buộc, 2-50 ký tự
            if (string.IsNullOrWhiteSpace(updatedPet.Name))
                throw new ArgumentException("Tên thú cưng là bắt buộc.");
            
            var petName = updatedPet.Name.Trim();
            if (petName.Length < 2 || petName.Length > 50)
                throw new ArgumentException("Tên thú cưng phải từ 2 đến 50 ký tự.");

            // Validation: Giống loài bắt buộc
            if (string.IsNullOrWhiteSpace(updatedPet.Breed))
                throw new ArgumentException("Giống loài là bắt buộc.");

            // Validation: Giới tính bắt buộc và hợp lệ
            if (string.IsNullOrWhiteSpace(updatedPet.Gender))
                throw new ArgumentException("Giới tính là bắt buộc.");
            
            var validGenders = new[] { "Đực", "Cái", "Male", "Female" };
            if (!validGenders.Contains(updatedPet.Gender, StringComparer.OrdinalIgnoreCase))
                throw new ArgumentException("Giới tính phải là 'Đực' hoặc 'Cái'.");

            // Validation: Mô tả tối đa 500 ký tự
            if (!string.IsNullOrEmpty(updatedPet.Description) && updatedPet.Description.Length > 500)
                throw new ArgumentException("Mô tả không được quá 500 ký tự.");

            // Business logic: Update pet
            pet.Name = petName;
            pet.Breed = updatedPet.Breed.Trim();
            pet.Gender = updatedPet.Gender;
            pet.IsActive = updatedPet.IsActive;
            pet.Description = updatedPet.Description?.Trim();
            pet.UpdatedAt = DateTime.Now;

            await _petRepository.UpdateAsync(pet, ct);

            // Business logic: If this pet is set as active, deactivate all other pets for this user
            if (pet.IsActive == true && pet.UserId.HasValue)
            {
                await _petRepository.DeactivateOtherPetsAsync(pet.UserId.Value, pet.PetId, ct);
            }

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

