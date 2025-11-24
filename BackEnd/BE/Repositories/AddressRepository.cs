using BE.Models;
using BE.Repositories.Interfaces;

namespace BE.Repositories
{
    public class AddressRepository : BaseRepository<Address>, IAddressRepository
    {
        public AddressRepository(PawnderDatabaseContext context) : base(context)
        {
        }

        public async Task<Address?> GetAddressByIdAsync(int addressId, CancellationToken ct = default)
        {
            return await _dbSet.FindAsync(new object[] { addressId }, ct);
        }
    }
}




