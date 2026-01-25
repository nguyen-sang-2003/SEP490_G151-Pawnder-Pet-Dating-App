using BE.Models;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class PetRecommendationService : IPetRecommendationService
    {
        private readonly PawnderDatabaseContext _context;
        private readonly DistanceService _distanceService;

        public PetRecommendationService(
            PawnderDatabaseContext context,
            DistanceService distanceService)
        {
            _context = context;
            _distanceService = distanceService;
        }

        public async Task<object> RecommendPetsAsync(int userId, CancellationToken ct = default)
        {
            // Business logic: Get user with preferences and address
            var user = await _context.Users
                .Include(u => u.UserPreferences)
                .ThenInclude(p => p.Attribute)
                .Include(u => u.Address)
                .FirstOrDefaultAsync(u => u.UserId == userId, ct);

            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng.");

            var preferences = user.UserPreferences.ToList();

            // Business logic: Get distance preference
            var distancePref = preferences?
                .FirstOrDefault(p => p.Attribute.Name.ToLower() == "khoảng cách");

            double? maxDistance = distancePref?.MaxValue;

            // Business logic: Get already matched users
            var userPetIds = await _context.Pets
                .Where(p => p.UserId == userId && p.IsDeleted == false)
                .Select(p => p.PetId)
                .ToListAsync(ct);

            // Logic giống Tinder: Loại trừ cả Pending và Accepted matches
            // - Nếu A đã like B (Pending/Accepted), thì B KHÔNG thấy A trong màn hình quẹt
            // - Nếu B đã like A (Pending/Accepted), thì A KHÔNG thấy B trong màn hình quẹt
            // - Match đã unmatch (IsDeleted == true) sẽ được hiển thị lại
            
            // sentToUsers: Loại trừ users mà current user đã gửi like (Pending hoặc Accepted)
            var sentToUsers = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c => c.IsDeleted == false  // Chỉ lấy match chưa bị hủy
                           && (c.Status == "Pending" || c.Status == "Accepted")  // Loại trừ cả pending và accepted
                           && c.FromPet != null && c.ToPet != null
                           && userPetIds.Contains(c.FromPetId ?? -1))
                .Select(c => c.ToPet!.UserId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToListAsync(ct);

            // receivedFromUsers: Loại trừ users đã gửi like cho current user (Pending hoặc Accepted)
            // Nếu người khác đã like user, user không nên thấy họ trong màn hình quẹt (họ sẽ ở "Likes You")
            var receivedFromUsers = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .Where(c => c.IsDeleted == false  // Chỉ lấy match chưa bị hủy
                           && (c.Status == "Pending" || c.Status == "Accepted")  // Loại trừ cả pending và accepted
                           && c.FromPet != null && c.ToPet != null
                           && userPetIds.Contains(c.ToPetId ?? -1))
                .Select(c => c.FromPet!.UserId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToListAsync(ct);

            var alreadyMatchedUserIds = sentToUsers.Union(receivedFromUsers).ToHashSet();

            // Business logic: Get blocked users
            var blockedUserIds = (await _context.Blocks
                .Where(b => b.FromUserId == userId)
                .Select(b => b.ToUserId)
                .ToListAsync(ct)).ToHashSet();

            // Business logic: Load all active pets with their characteristics
            // Valid pet filter: IsDeleted=false, has at least 1 non-deleted PetPhoto, has at least 1 PetCharacteristic
            var pets = await _context.Pets
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Attribute)
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Option)
                .Include(p => p.User)
                    .ThenInclude(u => u!.Address)
                .Include(p => p.PetPhotos.Where(photo => photo.IsDeleted == false))
                .Where(p => p.UserId != null
                         && p.UserId != userId
                         && p.IsDeleted == false
                         && p.IsActive == true
                         && p.PetPhotos.Any(pp => pp.IsDeleted == false)
                         && p.PetCharacteristics.Any()
                         && !alreadyMatchedUserIds.Contains(p.UserId.Value)
                         && !blockedUserIds.Contains(p.UserId.Value))
                .ToListAsync(ct);

            var matchedPets = new List<(Pet Pet, decimal Score, decimal TotalPercent, double? Distance, List<object> MatchedAttributes)>();

            // Business logic: Filter preferences, excluding distance
            var attributePreferences = (preferences ?? new List<UserPreference>())
                .Where(p => p.Attribute.Name.ToLower() != "khoảng cách")
                .ToList();

            // Business logic: Calculate total Percent
            decimal totalPercent = 0;
            foreach (var pref in attributePreferences)
            {
                totalPercent += pref.Attribute.Percent ?? 0;
            }

            // Business logic: Score each pet
            foreach (var pet in pets)
            {
                decimal score = 0;
                var matchedAttributes = new List<object>();

                foreach (var pref in attributePreferences)
                {
                    var petChar = pet.PetCharacteristics.FirstOrDefault(pc =>
                        pc.AttributeId == pref.AttributeId);

                    if (petChar == null)
                        continue;

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
                    // Handle case where only MaxValue is set
                    else if (pref.MaxValue != null && petChar.Value != null && pref.MinValue == null)
                    {
                        isMatch = petChar.Value <= pref.MaxValue;
                    }

                    if (isMatch)
                    {
                        score += pref.Attribute.Percent ?? 0;
                        
                        // Lưu thông tin attribute đã match
                        matchedAttributes.Add(new
                        {
                            AttributeId = pref.Attribute.AttributeId,
                            AttributeName = pref.Attribute.Name,
                            Percent = pref.Attribute.Percent ?? 0,
                            PetValue = petChar.OptionId != null 
                                ? petChar.Option?.Name ?? petChar.OptionId.ToString()
                                : petChar.Value?.ToString(),
                            PetOptionName = petChar.Option?.Name
                        });
                    }
                }

                // Business logic: Filter by distance if specified
                double? distance = null;
                if (maxDistance != null && maxDistance > 0)
                {
                    distance = await _distanceService.GetDistanceBetweenUsersAsync(userId, pet.UserId);
                    
                    if (distance == null)
                        continue; // Skip if no address data
                    
                    if (distance > maxDistance)
                        continue; // Skip if too far
                }

                matchedPets.Add((Pet: pet, Score: score, TotalPercent: totalPercent, Distance: distance, MatchedAttributes: matchedAttributes));
            }

            // Business logic: Sort and take top 20
            var result = matchedPets
                .OrderByDescending(p => p.TotalPercent > 0 ? p.Score / p.TotalPercent : 0)
                .ThenBy(p => p.Distance ?? double.MaxValue)
                .Take(20)
                .Select(p =>
                {
                    // Get Age from PetCharacteristic only
                    int? age = null;
                    var ageChar = p.Pet.PetCharacteristics
                        .FirstOrDefault(pc => pc.Attribute != null &&
                                             (pc.Attribute.Name.ToLower() == "tuổi" ||
                                              pc.Attribute.Name.ToLower() == "age"));
                    if (ageChar != null && ageChar.Value.HasValue)
                    {
                        age = (int)Math.Round((double)ageChar.Value.Value);
                    }

                    return new
                    {
                        PetId = p.Pet.PetId,
                        UserId = p.Pet.UserId,
                        Name = p.Pet.Name,
                        Breed = p.Pet.Breed,
                        Gender = p.Pet.Gender,
                        Age = age,
                        Description = p.Pet.Description,
                        MatchPercent = p.TotalPercent > 0 ? Math.Round((decimal)(p.Score / p.TotalPercent) * 100, 1) : 0,
                        MatchScore = p.Score,
                        TotalPercent = p.TotalPercent,
                        DistanceKm = p.Distance != null ? Math.Round(p.Distance.Value, 2) : (double?)null,
                        MatchedAttributes = p.MatchedAttributes,
                        Photos = p.Pet.PetPhotos
                            .Where(photo => !string.IsNullOrEmpty(photo.ImageUrl))
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
                    };
                })
                .ToList();

            var hasPreferences = attributePreferences.Count > 0;
            var resultCount = result.Count;
            var preferencesCount = attributePreferences.Count;

            return new
            {
                message = hasPreferences
                    ? $"Tìm thấy {resultCount} thú cưng (sorted by {preferencesCount} preferences)."
                    : $"Hiển thị {resultCount} thú cưng (chưa có filter).",
                totalPreferences = preferencesCount,
                hasPreferences = hasPreferences,
                data = result
            };
        }

        public async Task<object> RecommendPetsForPetAsync(int preferenceUserId, int targetPetId, CancellationToken ct = default)
        {
            // Business logic: Get user with preferences and address (from preferenceUserId)
            var user = await _context.Users
                .Include(u => u.UserPreferences)
                .ThenInclude(p => p.Attribute)
                .Include(u => u.Address)
                .FirstOrDefaultAsync(u => u.UserId == preferenceUserId, ct);

            if (user == null)
                throw new KeyNotFoundException("Không tìm thấy người dùng.");

            var preferences = user.UserPreferences.ToList();

            // Business logic: Get target pet with characteristics (to calculate score)
            // Valid pet filter: IsDeleted=false, has at least 1 non-deleted PetPhoto, has at least 1 PetCharacteristic
            var targetPet = await _context.Pets
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Attribute)
                .Include(p => p.PetCharacteristics)
                    .ThenInclude(pc => pc.Option)
                .Include(p => p.User)
                    .ThenInclude(u => u!.Address)
                .Include(p => p.PetPhotos.Where(photo => photo.IsDeleted == false))
                .FirstOrDefaultAsync(p => p.PetId == targetPetId 
                    && p.IsDeleted == false
                    && p.PetPhotos.Any(pp => pp.IsDeleted == false)
                    && p.PetCharacteristics.Any(), ct);

            if (targetPet == null)
                throw new KeyNotFoundException("Không tìm thấy thú cưng để tính điểm.");

            if (targetPet.UserId == null)
                throw new KeyNotFoundException("Thú cưng để tính điểm không có chủ sở hữu.");

            // Business logic: Get distance preference
            var distancePref = preferences?
                .FirstOrDefault(p => p.Attribute.Name.ToLower() == "khoảng cách");

            double? maxDistance = distancePref?.MaxValue;

            // Business logic: Filter preferences, excluding distance
            var attributePreferences = (preferences ?? new List<UserPreference>())
                .Where(p => p.Attribute.Name.ToLower() != "khoảng cách")
                .ToList();

            // Business logic: Calculate total Percent
            decimal totalPercent = 0;
            foreach (var pref in attributePreferences)
            {
                totalPercent += pref.Attribute.Percent ?? 0;
            }

            // Business logic: Score the target pet
            decimal score = 0;
            var matchedAttributes = new List<object>();

            foreach (var pref in attributePreferences)
            {
                var petChar = targetPet.PetCharacteristics.FirstOrDefault(pc =>
                    pc.AttributeId == pref.AttributeId);

                if (petChar == null)
                    continue;

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
                // Handle case where only MaxValue is set
                else if (pref.MaxValue != null && petChar.Value != null && pref.MinValue == null)
                {
                    isMatch = petChar.Value <= pref.MaxValue;
                }

                if (isMatch)
                {
                    score += pref.Attribute.Percent ?? 0;
                    
                    // Lưu thông tin attribute đã match
                    matchedAttributes.Add(new
                    {
                        AttributeId = pref.Attribute.AttributeId,
                        AttributeName = pref.Attribute.Name,
                        Percent = pref.Attribute.Percent ?? 0,
                        PetValue = petChar.OptionId != null 
                            ? petChar.Option?.Name ?? petChar.OptionId.ToString()
                            : petChar.Value?.ToString(),
                        PetOptionName = petChar.Option?.Name
                    });
                }
            }

            // Business logic: Calculate distance if specified (between preference user and target pet user)
            double? distance = null;
            if (maxDistance != null && maxDistance > 0)
            {
                distance = await _distanceService.GetDistanceBetweenUsersAsync(preferenceUserId, targetPet.UserId);
                
                if (distance == null)
                    distance = null; // No address data
                else if (distance > maxDistance)
                    distance = null; // Too far, but we still return the result
            }

            // Get Age from PetCharacteristic only
            int? age = null;
            var ageChar = targetPet.PetCharacteristics
                .FirstOrDefault(pc => pc.Attribute != null &&
                                     (pc.Attribute.Name.ToLower() == "tuổi" ||
                                      pc.Attribute.Name.ToLower() == "age"));
            if (ageChar != null && ageChar.Value.HasValue)
            {
                age = (int)Math.Round((double)ageChar.Value.Value);
            }

            var result = new
            {
                PetId = targetPet.PetId,
                UserId = targetPet.UserId,
                Name = targetPet.Name,
                Breed = targetPet.Breed,
                Gender = targetPet.Gender,
                Age = age,
                Description = targetPet.Description,
                MatchPercent = totalPercent > 0 ? Math.Round((decimal)(score / totalPercent) * 100, 1) : 0,
                MatchScore = score,
                TotalPercent = totalPercent,
                DistanceKm = distance != null ? Math.Round(distance.Value, 2) : (double?)null,
                MatchedAttributes = matchedAttributes,
                Photos = targetPet.PetPhotos
                    .Where(photo => !string.IsNullOrEmpty(photo.ImageUrl))
                    .OrderBy(photo => photo.SortOrder)
                    .Select(photo => photo.ImageUrl)
                    .ToList(),
                Owner = targetPet.User != null ? new
                {
                    UserId = targetPet.User.UserId,
                    FullName = targetPet.User.FullName,
                    Gender = targetPet.User.Gender,
                    Address = targetPet.User.Address != null ? new
                    {
                        City = targetPet.User.Address.City,
                        District = targetPet.User.Address.District
                    } : null
                } : null
            };

            var hasPreferences = attributePreferences.Count > 0;
            var preferencesCount = attributePreferences.Count;

            return new
            {
                message = hasPreferences
                    ? $"Đã tính điểm matching cho thú cưng (dựa trên {preferencesCount} preferences)."
                    : $"Đã tính điểm matching cho thú cưng (chưa có filter).",
                totalPreferences = preferencesCount,
                hasPreferences = hasPreferences,
                data = result
            };
        }
    }
}




