using BE.Models;

namespace BE.Repositories.Interfaces;

public interface IAppointmentLocationRepository : IBaseRepository<PetAppointmentLocation>
{
    /// <summary>
    /// Lấy danh sách địa điểm Pet-Friendly theo thành phố
    /// </summary>
    Task<IEnumerable<PetAppointmentLocation>> GetByCityAsync(string city, CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách địa điểm gần vị trí hiện tại
    /// </summary>
    Task<IEnumerable<PetAppointmentLocation>> GetNearbyLocationsAsync(
        decimal latitude, 
        decimal longitude, 
        decimal radiusKm = 10, 
        CancellationToken ct = default);

    /// <summary>
    /// Tìm địa điểm theo Google Place ID
    /// </summary>
    Task<PetAppointmentLocation?> GetByGooglePlaceIdAsync(string googlePlaceId, CancellationToken ct = default);
}
