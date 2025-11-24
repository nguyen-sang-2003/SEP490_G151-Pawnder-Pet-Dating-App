using BE.Models;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
	public class DistanceService
	{
		private readonly PawnderDatabaseContext _context;

		public DistanceService(PawnderDatabaseContext context)
		{
			_context = context;
		}

		/// <summary>
		/// Tính khoảng cách giữa 2 người dùng theo ID (đơn vị km)
		/// </summary>
		public async Task<double?> GetDistanceBetweenUsersAsync(int userId1, int? userId2)
		{
			var user1 = await _context.Users
				.Include(u => u.Address)
				.FirstOrDefaultAsync(u => u.UserId == userId1);

			var user2 = await _context.Users
				.Include(u => u.Address)
				.FirstOrDefaultAsync(u => u.UserId == userId2);

			if (user1?.Address == null || user2?.Address == null)
			{
				Console.WriteLine($"⚠️ Missing address - User1 (ID: {userId1}) has address: {user1?.Address != null}, User2 (ID: {userId2}) has address: {user2?.Address != null}");
				return null;
			}

			var addr1 = user1.Address;
			var addr2 = user2.Address;

			Console.WriteLine($"📍 User1 (ID: {userId1}): Lat={addr1.Latitude}, Lon={addr1.Longitude}");
			Console.WriteLine($"📍 User2 (ID: {userId2}): Lat={addr2.Latitude}, Lon={addr2.Longitude}");

			var distance = CalculateDistanceKm(
				(double)addr1.Latitude!,
				(double)addr1.Longitude!,
				(double)addr2.Latitude!,
				(double)addr2.Longitude!
			);
			
			Console.WriteLine($"📏 Calculated distance: {distance} km");
			
			return distance;
		}

		/// <summary>
		/// Hàm tính khoảng cách theo công thức Haversine (km)
		/// </summary>
		public double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
		{
			const double R = 6371; // Bán kính Trái Đất (km)
			double dLat = ToRadians(lat2 - lat1);
			double dLon = ToRadians(lon2 - lon1);

			double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
					   Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
					   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

			double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
			return R * c;
		}

		private double ToRadians(double deg)
		{
			return deg * (Math.PI / 180);
		}
	}
}
