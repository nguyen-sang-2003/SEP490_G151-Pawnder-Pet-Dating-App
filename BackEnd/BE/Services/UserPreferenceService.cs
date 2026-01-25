using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class UserPreferenceService : IUserPreferenceService
    {
        private readonly IUserPreferenceRepository _userPreferenceRepository;
        private readonly PawnderDatabaseContext _context;

        // Validation ranges cho các thuộc tính filter của mèo (BR: Business Requirements)
        // Weight stored as gram (INT) in database: 500g = 0.5kg, 12000g = 12kg
        private static readonly Dictionary<string, (int Min, int Max, string Unit)> AttributeRanges = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Cân nặng", (500, 12000, "gram") },  // BR: 0.5-12kg
            { "Chiều cao", (15, 40, "cm") },       // BR: 15-40cm
            { "Tuổi", (0, 25, "năm") },            // BR: 0-25 năm
            { "Khoảng cách", (0, 100, "km") }      // BR: 0-100km
        };

        public UserPreferenceService(
            IUserPreferenceRepository userPreferenceRepository,
            PawnderDatabaseContext context)
        {
            _userPreferenceRepository = userPreferenceRepository;
            _context = context;
        }

        /// <summary>
        /// Validate MinValue và MaxValue theo range hợp lệ cho mèo
        /// </summary>
        private void ValidatePreferenceRange(string attributeName, int? minValue, int? maxValue)
        {
            // Validate MinValue không âm
            if (minValue.HasValue && minValue.Value < 0)
                throw new ArgumentException($"Giá trị tối thiểu của {attributeName} không được là số âm.");

            // Validate MaxValue không âm
            if (maxValue.HasValue && maxValue.Value < 0)
                throw new ArgumentException($"Giá trị tối đa của {attributeName} không được là số âm.");

            // Validate MinValue <= MaxValue
            if (minValue.HasValue && maxValue.HasValue && minValue.Value > maxValue.Value)
                throw new ArgumentException($"Giá trị tối thiểu ({minValue}) phải nhỏ hơn hoặc bằng giá trị tối đa ({maxValue}).");

            // Validate theo range của attribute
            if (AttributeRanges.TryGetValue(attributeName, out var range))
            {
                if (minValue.HasValue && (minValue.Value < range.Min || minValue.Value > range.Max))
                    throw new ArgumentException($"Giá trị tối thiểu của {attributeName} phải từ {range.Min} đến {range.Max} {range.Unit}.");

                if (maxValue.HasValue && (maxValue.Value < range.Min || maxValue.Value > range.Max))
                    throw new ArgumentException($"Giá trị tối đa của {attributeName} phải từ {range.Min} đến {range.Max} {range.Unit}.");
            }
        }

        public async Task<IEnumerable<UserPreferenceResponse>> GetUserPreferencesAsync(int userId, CancellationToken ct = default)
        {
            // Business logic: Validate user exists
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId && (u.IsDeleted == null || u.IsDeleted == false), ct);
            if (!userExists)
                throw new KeyNotFoundException("User not found.");

            return await _userPreferenceRepository.GetUserPreferencesAsync(userId, ct);
        }

        public async Task<object> CreateUserPreferenceAsync(int userId, int attributeId, UserPreferenceUpsertRequest req, CancellationToken ct = default)
        {
            // Business logic: Validate user
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId && (u.IsDeleted == null || u.IsDeleted == false), ct);
            if (!userExists)
                throw new KeyNotFoundException("User not found.");

            // Business logic: Validate attribute
            var attribute = await _context.Attributes
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AttributeId == attributeId && a.IsDeleted == false, ct);
            if (attribute == null)
                throw new KeyNotFoundException("Attribute not found.");

            // Business logic: Validate range values cho mèo
            ValidatePreferenceRange(attribute.Name, req.MinValue, req.MaxValue);

            // Business logic: Check duplicate
            var exists = await _userPreferenceRepository.ExistsAsync(userId, attributeId, ct);
            if (exists)
                throw new InvalidOperationException("User preference already exists for this attribute.");

            var entity = new UserPreference
            {
                UserId = userId,
                AttributeId = attributeId,
                OptionId = req.OptionId,
                MinValue = req.MinValue,
                MaxValue = req.MaxValue,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _userPreferenceRepository.AddAsync(entity, ct);

            return new { userId, attributeId, OptionId = entity.OptionId, MinValue = entity.MinValue, MaxValue = entity.MaxValue };
        }

        public async Task<UserPreferenceResponse> UpdateUserPreferenceAsync(int userId, int attributeId, UserPreferenceUpsertRequest req, CancellationToken ct = default)
        {
            var entity = await _userPreferenceRepository.GetUserPreferenceAsync(userId, attributeId, ct);
            if (entity == null)
                throw new KeyNotFoundException("User preference not found.");

            // Business logic: Validate range values cho mèo
            if (entity.Attribute != null)
            {
                ValidatePreferenceRange(entity.Attribute.Name, req.MinValue, req.MaxValue);
            }

            // Business logic: Update preference
            entity.OptionId = req.OptionId;
            entity.MinValue = req.MinValue;
            entity.MaxValue = req.MaxValue;
            entity.UpdatedAt = DateTime.Now;

            await _userPreferenceRepository.UpdateAsync(entity, ct);

            return new UserPreferenceResponse
            {
                AttributeId = entity.AttributeId,
                AttributeName = entity.Attribute.Name!,
                TypeValue = entity.Attribute.TypeValue,
                Unit = entity.Attribute.Unit,
                OptionId = entity.OptionId,
                OptionName = entity.Option != null ? entity.Option.Name : null,
                MinValue = entity.MinValue,
                MaxValue = entity.MaxValue,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }

        public async Task<bool> DeleteUserPreferencesAsync(int userId, CancellationToken ct = default)
        {
            var preferences = await _userPreferenceRepository.GetUserPreferencesByUserIdAsync(userId, ct);
            if (preferences == null || !preferences.Any())
                return false;

            await _userPreferenceRepository.DeleteRangeAsync(preferences, ct);
            return true;
        }

        public async Task<object> UpsertBatchAsync(int userId, UserPreferenceBatchUpsertRequest request, CancellationToken ct = default)
        {
            // Business logic: Validate user
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId && (u.IsDeleted == null || u.IsDeleted == false), ct);
            if (!userExists)
                throw new KeyNotFoundException("User không tồn tại.");

            // Business logic: Validate attributes
            if (request.Preferences != null && request.Preferences.Any())
            {
                var attributeIds = request.Preferences.Select(p => p.AttributeId).Distinct().ToList();
                var validAttributes = await _context.Attributes
                    .Where(a => attributeIds.Contains(a.AttributeId) && a.IsDeleted == false)
                    .ToListAsync(ct);

                if (validAttributes.Count != attributeIds.Count)
                    throw new ArgumentException("Có attribute không hợp lệ hoặc đã bị xóa.");

                // Business logic: Validate range values cho từng preference
                foreach (var pref in request.Preferences)
                {
                    var attr = validAttributes.FirstOrDefault(a => a.AttributeId == pref.AttributeId);
                    if (attr != null)
                    {
                        ValidatePreferenceRange(attr.Name, pref.MinValue, pref.MaxValue);
                    }
                }
            }

            // Business logic: Get existing preferences
            var existingPreferences = await _userPreferenceRepository.GetUserPreferencesByUserIdAsync(userId, ct);

            // Business logic: If request is empty, delete all
            if (request.Preferences == null || request.Preferences.Count == 0)
            {
                if (existingPreferences.Any())
                {
                    await _userPreferenceRepository.DeleteRangeAsync(existingPreferences, ct);
                    return new
                    {
                        message = $"Đã xóa tất cả {existingPreferences.Count()} sở thích.",
                        created = 0,
                        updated = 0,
                        deleted = existingPreferences.Count()
                    };
                }
                return new
                {
                    message = "Không có sở thích nào để xóa.",
                    created = 0,
                    updated = 0,
                    deleted = 0
                };
            }

            var now = DateTime.Now;
            var created = 0;
            var updated = 0;

            // Business logic: Get list of attributeIds in the request
            var requestAttributeIds = request.Preferences.Select(p => p.AttributeId).ToHashSet();

            // Business logic: Delete preferences that are not in the request
            var prefsToDelete = existingPreferences.Where(ep => !requestAttributeIds.Contains(ep.AttributeId)).ToList();
            if (prefsToDelete.Any())
            {
                await _userPreferenceRepository.DeleteRangeAsync(prefsToDelete, ct);
            }

            // Business logic: Upsert preferences
            foreach (var pref in request.Preferences)
            {
                var existing = existingPreferences.FirstOrDefault(ep => ep.AttributeId == pref.AttributeId);

                if (existing != null)
                {
                    // Update existing
                    existing.OptionId = pref.OptionId;
                    existing.MinValue = pref.MinValue;
                    existing.MaxValue = pref.MaxValue;
                    existing.UpdatedAt = now;
                    await _userPreferenceRepository.UpdateAsync(existing, ct);
                    updated++;
                }
                else
                {
                    // Create new
                    var newPref = new UserPreference
                    {
                        UserId = userId,
                        AttributeId = pref.AttributeId,
                        OptionId = pref.OptionId,
                        MinValue = pref.MinValue,
                        MaxValue = pref.MaxValue,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    await _userPreferenceRepository.AddAsync(newPref, ct);
                    created++;
                }
            }

            return new
            {
                message = $"Lưu sở thích thành công. Tạo mới: {created}, Cập nhật: {updated}, Xóa: {prefsToDelete.Count}",
                created,
                updated,
                deleted = prefsToDelete.Count
            };
        }
    }
}




