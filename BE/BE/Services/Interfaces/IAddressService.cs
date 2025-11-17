using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IAddressService
    {
        Task<object> CreateAddressForUserAsync(int userId, LocationDto locationDto, CancellationToken ct = default);
        Task<object> UpdateAddressAsync(int addressId, LocationDto locationDto, CancellationToken ct = default);
        Task<object> UpdateAddressManualAsync(int addressId, ManualAddressDto dto, CancellationToken ct = default);
        Task<object> GetAddressByIdAsync(int addressId, CancellationToken ct = default);
    }
}




