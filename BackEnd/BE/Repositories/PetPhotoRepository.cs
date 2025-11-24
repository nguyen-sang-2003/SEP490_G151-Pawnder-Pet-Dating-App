using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories
{
    public class PetPhotoRepository : BaseRepository<PetPhoto>, IPetPhotoRepository
    {
        public PetPhotoRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<IEnumerable<PetPhotoResponse>> GetPhotosByPetIdAsync(int petId, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(p => p.PetId == petId && p.IsDeleted == false)
                .OrderBy(p => p.SortOrder).ThenBy(p => p.PhotoId)
                .Select(p => new PetPhotoResponse
                {
                    PhotoId = p.PhotoId,
                    PetId = p.PetId,
                    Url = p.ImageUrl,
                    IsPrimary = p.IsPrimary,
                    SortOrder = p.SortOrder
                })
                .ToListAsync(ct);
        }

        public async Task<int> GetPhotoCountByPetIdAsync(int petId, CancellationToken ct = default)
        {
            return await _dbSet.CountAsync(p => p.PetId == petId && p.IsDeleted == false, ct);
        }

        public async Task<int?> GetMaxSortOrderAsync(int petId, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(p => p.PetId == petId && p.IsDeleted == false)
                .MaxAsync(p => (int?)p.SortOrder, ct);
        }
    }
}




