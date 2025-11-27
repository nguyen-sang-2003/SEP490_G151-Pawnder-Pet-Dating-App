using BE.Models;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BE.Tests.AddressTests
{
	public class DistanceServiceRealDbTests
	{
		[Fact]
		public void CalculateDistanceKm_ShouldReturnCorrectDistance_BetweenHanoiAndHCM()
		{
			// Arrange
			var service = new DistanceService(null); // ❗ không cần DbContext
			double lat1 = 21.028511;  // Hà Nội
			double lon1 = 105.804817;
			double lat2 = 10.776889;  // TP.HCM
			double lon2 = 106.700806;

			// Act
			double distance = service.CalculateDistanceKm(lat1, lon1, lat2, lon2);

			// Assert
			Assert.InRange(distance, 1100, 1300); // thực tế ~1140 km
		}

		[Fact]
		public void CalculateDistanceKm_ShouldReturnZero_WhenSameLocation()
		{
			var service = new DistanceService(null);

			double lat = 21.028511;
			double lon = 105.804817;

			double distance = service.CalculateDistanceKm(lat, lon, lat, lon);

			Assert.Equal(0, distance, 3); // cho phép sai số nhỏ
		}

		[Fact]
		public void CalculateDistanceKm_ShouldHandleNegativeCoordinates()
		{
			var service = new DistanceService(null);

			double lat1 = -33.865143; // Sydney
			double lon1 = 151.209900;
			double lat2 = 51.507351;  // London
			double lon2 = -0.127758;

			double distance = service.CalculateDistanceKm(lat1, lon1, lat2, lon2);

			Assert.InRange(distance, 16000, 18000); // thực tế ~17,000 km
		}
	}
}
