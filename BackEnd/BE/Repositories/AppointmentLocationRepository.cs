using BE.Models;
using BE.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Repositories;

public class AppointmentLocationRepository : BaseRepository<PetAppointmentLocation>, IAppointmentLocationRepository
{
    public AppointmentLocationRepository(PawnderDatabaseContext context) : base(context)
    {
    }

    public async Task<IEnumerable<PetAppointmentLocation>> GetByCityAsync(string city, CancellationToken ct = default)
    {
        return await _dbSet
            .Where(l => l.City != null && l.City.ToLower() == city.ToLower() && l.IsPetFriendly == true)
            .OrderBy(l => l.Name)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<PetAppointmentLocation>> GetNearbyLocationsAsync(
        decimal latitude,
        decimal longitude,
        decimal radiusKm = 10,
        CancellationToken ct = default)
    {
        // Sử dụng công thức Haversine đơn giản để tính khoảng cách
        // 1 độ latitude ≈ 111km
        var latDiff = radiusKm / 111m;
        var lonDiff = radiusKm / (111m * (decimal)Math.Cos((double)latitude * Math.PI / 180));

        return await _dbSet
            .Where(l =>
                l.IsPetFriendly == true &&
                l.Latitude >= latitude - latDiff &&
                l.Latitude <= latitude + latDiff &&
                l.Longitude >= longitude - lonDiff &&
                l.Longitude <= longitude + lonDiff)
            .OrderBy(l => Math.Abs((double)(l.Latitude - latitude)) + Math.Abs((double)(l.Longitude - longitude)))
            .Take(20)
            .ToListAsync(ct);
    }

    public async Task<PetAppointmentLocation?> GetByGooglePlaceIdAsync(string googlePlaceId, CancellationToken ct = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(l => l.GooglePlaceId == googlePlaceId, ct);
    }
}
