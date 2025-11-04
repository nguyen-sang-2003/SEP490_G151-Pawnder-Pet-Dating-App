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
                .Include(u => u.Address)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            var preferences = user.UserPreferences.ToList();
            
            // Nếu chưa có preferences, vẫn return all pets (score = 0 for all)
            // Đây là optional filter - không bắt buộc phải set
            
            // Lấy khoảng cách từ Attribute "Khoảng cách"
            var distancePref = preferences?
                .FirstOrDefault(p => p.Attribute.Name.ToLower() == "khoảng cách");

            double? maxDistance = distancePref?.MaxValue;

            // Get list of users already matched (to exclude them)
            var sentToUsers = await _context.ChatUsers
                .Where(c => c.FromUserId == userId && c.IsDeleted == false)
                .Select(c => c.ToUserId)
                .ToListAsync();

            var receivedFromUsers = await _context.ChatUsers
                .Where(c => c.ToUserId == userId && c.IsDeleted == false)
                .Select(c => c.FromUserId)
                .ToListAsync();

            var alreadyMatchedUserIds = sentToUsers.Union(receivedFromUsers).ToHashSet();

            // Get blocked users
            var blockedUserIds = (await _context.Blocks
                .Where(b => b.FromUserId == userId)
                .Select(b => b.ToUserId)
                .ToListAsync()).ToHashSet();

            // Load all active pets with their characteristics
            var pets = await _context.Pets
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Attribute)
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Option)
                .Include(p => p.User)
                    .ThenInclude(u => u.Address)
                .Include(p => p.PetPhotos.Where(photo => photo.IsDeleted == false))
                .Where(p => p.UserId != null
                         && p.UserId != userId
                         && p.IsDeleted == false
                         && p.IsActive == true
                         && !alreadyMatchedUserIds.Contains(p.UserId.Value)
                         && !blockedUserIds.Contains(p.UserId.Value))
                .ToListAsync();

            var matchedPets = new List<(Pet Pet, decimal Score, decimal totalPercent, double? Distance)>();

            // Filter preferences, excluding distance
            var attributePreferences = (preferences ?? new List<UserPreference>())
                .Where(p => p.Attribute.Name.ToLower() != "khoảng cách")
                .ToList();
            
            foreach (var pet in pets)
            {
                double score = 0;
                double totalPref = attributePreferences.Count;

                // Scoring system - không bắt buộc match all
                foreach (var pref in attributePreferences)
                {
                    var petChar = pet.PetCharacteristics.FirstOrDefault(pc =>
                        pc.AttributeId == pref.AttributeId);

                    if (petChar == null)
                    {
                        // Pet không có attribute này -> skip, không tính điểm
                        continue;
                    }

                    // Check if it matches based on type
                    bool isMatch = false;

                    // For option-based attributes (string type)
                    if (pref.OptionId != null && petChar.OptionId != null)
                    {
                        isMatch = petChar.OptionId == pref.OptionId;
                    }
                    // For range-based attributes (float/number type)
                    else if (pref.MinValue != null && pref.MaxValue != null && petChar.Value != null)
                    {
                        isMatch = petChar.Value >= pref.MinValue && petChar.Value <= pref.MaxValue;
                    }
                    // Handle case where only MaxValue is set (like Distance)
                    else if (pref.MaxValue != null && petChar.Value != null && pref.MinValue == null)
                    {
                        isMatch = petChar.Value <= pref.MaxValue;
                    }

                    if (isMatch)
                    {
                        score++; // Cộng điểm nếu match
                    }
                }

                // Show all pets, even with 0 matches (if no preferences, all pets shown)
                // Pets will be sorted by score later

                // Xử lý lọc theo Khoảng cách nếu có
                double? distance = null;
                if (maxDistance != null || maxDistance > 0)
                {
                    distance = await _distanceService.GetDistanceBetweenUsersAsync(userId, pet.UserId);
                    
                    if (distance == null)
                    {
                        continue; // Skip if no address data
                    }
                    
                    if (distance > maxDistance)
                    {
                        continue; // Skip if too far
                    }
                }

                matchedPets.Add((Pet: pet, Score: score, TotalPref: totalPref, Distance: distance));
            }

            var result = matchedPets
                .OrderByDescending(p => p.TotalPref > 0 ? p.Score / p.TotalPref : 0)
                .ThenBy(p => p.Distance ?? double.MaxValue)
                .Take(20)
                .Select(p => new
                {
                    PetId = p.Pet.PetId,
                    UserId = p.Pet.UserId,
                    Name = p.Pet.Name,
                    Breed = p.Pet.Breed,
                    Gender = p.Pet.Gender,
                    Age = p.Pet.Age,
                    Description = p.Pet.Description,
                    MatchPercent = p.TotalPref > 0 ? Math.Round((p.Score / p.TotalPref) * 100, 1) : 0,
                    MatchScore = p.Score,
                    TotalAttributes = p.TotalPref,
                    DistanceKm = p.Distance != null ? Math.Round(p.Distance.Value, 2) : (double?)null,
                    Photos = p.Pet.PetPhotos
                        .OrderBy(photo => photo.SortOrder)
                        .Select(photo => photo.ImageUrl)
                        .ToList(),
                    Owner = p.Pet.User != null ? new
                    {
                        UserId = p.Pet.User.UserId,
                        FullName = p.Pet.User.FullName,
                        Gender = p.Pet.User.Gender,
                        Address = p.Pet.User.Address != null ? new
                        {
                            City = p.Pet.User.Address.City,
                            District = p.Pet.User.Address.District
                        } : null
                    } : null
                })
                .ToList();

            var hasPreferences = attributePreferences.Count > 0;
            return Ok(new
            {
                message = hasPreferences 
                    ? $"Tìm thấy {result.Count} thú cưng (sorted by {attributePreferences.Count} preferences)."
                    : $"Hiển thị {result.Count} thú cưng (chưa có filter).",
                totalPreferences = attributePreferences.Count,
                hasPreferences = hasPreferences,
                data = result
            });
        }
    }
}
