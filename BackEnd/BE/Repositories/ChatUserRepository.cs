using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class ChatUserRepository : BaseRepository<ChatUser>, IChatUserRepository
    {
        public ChatUserRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<object>> GetInvitesAsync(int userId, CancellationToken ct = default)
        {
            var petIds = await _context.Pets
                .Where(p => p.UserId == userId && (p.IsDeleted == false))
                .Select(p => p.PetId)
                .ToListAsync(ct);

            if (!petIds.Any())
            {
                return new List<object>();
            }

            var petIdSet = petIds.ToHashSet();

            return await _dbSet
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c =>
                    c.Status == "Pending" &&
                    c.IsDeleted == false &&
                    c.ToPetId.HasValue &&
                    petIdSet.Contains(c.ToPetId.Value))
                .Select(c => new
                {
                    matchId = c.MatchId,
                    fromPetId = c.FromPetId,
                    fromPetName = c.FromPet != null ? c.FromPet.Name : null,
                    toPetId = c.ToPetId,
                    toPetName = c.ToPet != null ? c.ToPet.Name : null,
                    status = c.Status,
                    createdAt = c.CreatedAt
                })
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<object>> GetChatsAsync(int userId, int? petId, CancellationToken ct = default)
        {
            var petIds = await _context.Pets
                .Where(p => p.UserId == userId && p.IsDeleted == false)
                .Select(p => p.PetId)
                .ToListAsync(ct);

            if (!petIds.Any())
            {
                return new List<object>();
            }

            var petIdSet = petIds.ToHashSet();

            if (petId.HasValue && !petIdSet.Contains(petId.Value))
            {
                throw new ArgumentException("Pet không thuộc người dùng này.");
            }

            var filterSet = petId.HasValue ? new HashSet<int> { petId.Value } : petIdSet;

            return await _dbSet
                .Include(c => c.FromPet!)
                    .ThenInclude(p => p.User!)
                .Include(c => c.ToPet!)
                    .ThenInclude(p => p.User!)
                .Where(c =>
                    c.Status == "Accepted" &&
                    c.IsDeleted == false &&
                    (
                        (c.FromPetId.HasValue && filterSet.Contains(c.FromPetId.Value)) ||
                        (c.ToPetId.HasValue && filterSet.Contains(c.ToPetId.Value))
                    ))
                .Select(c => new
                {
                    matchId = c.MatchId,
                    fromPetId = c.FromPetId,
                    toPetId = c.ToPetId,
                    fromPetName = c.FromPet != null ? c.FromPet.Name : null,
                    toPetName = c.ToPet != null ? c.ToPet.Name : null,
                    fromUserId = c.FromPet != null && c.FromPet.User != null ? c.FromPet.User.UserId : (int?)null,
                    toUserId = c.ToPet != null && c.ToPet.User != null ? c.ToPet.User.UserId : (int?)null,
                    status = c.Status,
                    createdAt = c.CreatedAt,
                    fromPet = c.FromPet != null ? new
                    {
                        petId = c.FromPet.PetId,
                        name = c.FromPet.Name,
                        breed = c.FromPet.Breed,
                        gender = c.FromPet.Gender
                    } : null,
                    toPet = c.ToPet != null ? new
                    {
                        petId = c.ToPet.PetId,
                        name = c.ToPet.Name,
                        breed = c.ToPet.Breed,
                        gender = c.ToPet.Gender
                    } : null
                })
                .ToListAsync(ct);
        }

        public async Task<ChatUser?> GetChatUserByPetsAsync(int fromPetId, int toPetId, CancellationToken ct = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(c =>
                    c.FromPetId == fromPetId && c.ToPetId == toPetId && c.IsDeleted == false, ct);
        }

        public async Task<ChatUser?> GetChatUserByMatchIdAsync(int matchId, CancellationToken ct = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(cu => cu.MatchId == matchId && cu.Status == "Pending", ct);
        }
    }
}




