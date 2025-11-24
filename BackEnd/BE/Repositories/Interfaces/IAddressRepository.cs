using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IAddressRepository : IBaseRepository<Address>
    {
        Task<Address?> GetAddressByIdAsync(int addressId, CancellationToken ct = default);
    }
}




