using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PetRecommendationController : ControllerBase
    {
        private readonly PawnderDatabaseContext _context;
        private readonly DistanceService _distanceService;

        public PetRecommendationController(PawnderDatabaseContext context, DistanceService distanceService)
        {
            _context = context;
            _distanceService = distanceService;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> RecommendPets(int userId)
        {
            var user = await _context.Users
                .Include(u => u.UserPreferences)
                .ThenInclude(p => p.Attribute)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return NotFound("Không tìm thấy người dùng.");

            var preferences = user.UserPreferences;
            if (preferences == null || preferences.Count == 0)
                return BadRequest("Người dùng chưa có sở thích.");

            // Lấy Khoảng cách từ Attribute "Distance"
            var distancePref = preferences
                .FirstOrDefault(p => p.Attribute.Name.ToLower() == "Khoảng cách");

            double? maxDistance = distancePref?.MaxValue;

            // lấy tất cả pets trừ pet của chính user đó
            var pets = await _context.Pets.Where(p => p.UserId != userId)
                .Include(p => p.PetCharacteristics)
                .Include(p => p.User)
                .ThenInclude(u => u.Address)
                .ToListAsync();

            var matchedPets = new List<(Pet Pet, decimal Score, decimal totalPercent, double? Distance)>();

            foreach (var pet in pets)
            {
                decimal score = 0; // tổng Percent của những attribute trùng
                decimal totalPercent = 0;
                foreach (var pref in preferences)
                {
                    if (pref.Attribute.Name.ToLower() != "Khoảng cách")
                        totalPercent += pref.Attribute.Percent ?? 0; // tổng Percent của những attribute user chọn
                }

                foreach (var pref in preferences)
                {
                    // bỏ qua attribute Distance, xử lý riêng bên ngoài
                    if (pref.Attribute.Name.ToLower() == "Khoảng cách")
                        continue;

                    var petChar = pet.PetCharacteristics.FirstOrDefault(pc =>
                        pc.AttributeId == pref.AttributeId &&
                        (
                            (pref.OptionId != null && pc.OptionId == pref.OptionId)
                            ||
                            (pref.OptionId == null && pc.Value != null &&
                             pref.MinValue != null && pref.MaxValue != null &&
                             pc.Value >= pref.MinValue && pc.Value <= pref.MaxValue)
                        ));

                    if (petChar != null)
                        score += pref.Attribute.Percent ?? 0; // mỗi attribute khớp cộng trọng số Percent
                }

                if (score == 0)
                    continue; // không khớp gì thì bỏ qua

                // Xử lý lọc theo Khoảng cách nếu có
                double? distance = null;
                if (maxDistance != null || maxDistance > 0)
                {
                    distance = await _distanceService.GetDistanceBetweenUsersAsync(userId, pet.UserId);
                    if (distance == null || distance > maxDistance)
                        continue;
                }

                matchedPets.Add((pet, score, totalPercent, distance));
            }

            var result = matchedPets
                .OrderByDescending(p => p.Score / p.totalPercent)
                .ThenBy(p => p.Distance ?? double.MaxValue)
                .Take(20)
                .Select(p => new
                {
                    PetId = p.Pet.PetId,
                    Name = p.Pet.Name,
                    UserId = p.Pet.UserId,
                    MatchPercent = Math.Round((p.Score / p.totalPercent) * 100, 1),
                    DistanceKm = p.Distance,
                    Score = p.Score
                });

            return Ok(result);
        }
    }
}
