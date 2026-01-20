using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    /// <summary>
    /// Repository implementation cho Pet - chỉ xử lý query DB
    /// </summary>
    public class PetRepository : BaseRepository<Pet>, IPetRepository
    {
        public PetRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        /// <inheritdoc />
        public IQueryable<Pet> GetValidPetsQuery()
        {
            return _dbSet
                .Where(p => p.IsDeleted == false
                    && p.PetPhotos.Any(pp => pp.IsDeleted == false)
                    && p.PetCharacteristics.Any());
        }

        public async Task<IEnumerable<PetDto>> GetPetsByUserIdAsync(int userId, CancellationToken ct = default)
        {
            return await GetValidPetsQuery()
                .Include(p => p.PetPhotos)
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Attribute)
                .Where(p => p.UserId == userId)
                .Select(p => new PetDto
                {
                    PetId = p.PetId,
                    Name = p.Name,
                    Breed = p.Breed,
                    Gender = p.Gender,
                    Age = p.PetCharacteristics
                        .Where(pc => pc.Attribute != null && 
                                   (pc.Attribute.Name.ToLower() == "tuổi" || 
                                    pc.Attribute.Name.ToLower() == "age"))
                        .Select(pc => pc.Value.HasValue ? (int?)Math.Round((double)pc.Value.Value) : null)
                        .FirstOrDefault(),
                    IsActive = p.IsActive,
                    Description = p.Description,
                    UrlImageAvatar = p.PetPhotos
                        .Where(photo => photo.IsDeleted == false)
                        .OrderBy(photo => photo.SortOrder)
                        .Select(photo => photo.ImageUrl)
                        .FirstOrDefault() ?? string.Empty
                })
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<object>> GetPetsForMatchingAsync(
            int userId, 
            List<int> excludedUserIds, 
            List<int> blockedUserIds, 
            CancellationToken ct = default)
        {
            return await GetValidPetsQuery()
                .Include(p => p.PetPhotos)
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Attribute)
                .Include(p => p.User)
                    .ThenInclude(u => u!.Address)
                .Where(p => p.UserId != null
                         && p.UserId != userId
                         && p.IsActive == true
                         && !excludedUserIds.Contains(p.UserId.Value)
                         && !blockedUserIds.Contains(p.UserId.Value))
                .Select(p => new
                {
                    PetId = p.PetId,
                    UserId = p.UserId,
                    Name = p.Name,
                    Breed = p.Breed,
                    Gender = p.Gender,
                    Age = p.PetCharacteristics
                        .Where(pc => pc.Attribute != null && 
                                   (pc.Attribute.Name.ToLower() == "tuổi" || 
                                    pc.Attribute.Name.ToLower() == "age"))
                        .Select(pc => pc.Value.HasValue ? (int?)Math.Round((double)pc.Value.Value) : null)
                        .FirstOrDefault(),
                    Description = p.Description,
                    Photos = p.PetPhotos
                        .Where(photo => photo.IsDeleted == false)
                        .OrderBy(photo => photo.SortOrder)
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
                .ToListAsync(ct);
        }

        public async Task<Pet?> GetPetByIdWithDetailsAsync(int petId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(p => p.PetPhotos)
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Attribute)
                .Include(p => p.User)
                    .ThenInclude(u => u!.Address)
                .Where(p => p.PetId == petId && (p.IsDeleted == false))
                .FirstOrDefaultAsync(ct);
        }

        public async Task<bool> IsPetOwnerAsync(int petId, int userId, CancellationToken ct = default)
        {
            return await _dbSet
                .AnyAsync(p => p.PetId == petId && p.UserId == userId && (p.IsDeleted == false), ct);
        }

        public async Task DeactivateOtherPetsAsync(int userId, int activePetId, CancellationToken ct = default)
        {
            var userPets = await _dbSet
                .Where(p => p.UserId == userId && p.IsDeleted == false)
                .ToListAsync(ct);

            foreach (var pet in userPets)
            {
                pet.IsActive = (pet.PetId == activePetId);
                pet.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync(ct);
        }
    }
}




