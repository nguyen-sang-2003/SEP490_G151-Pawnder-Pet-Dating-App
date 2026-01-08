using BE.DTO;
using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;

namespace BE.Services
{
    public class BadWordManagementService : IBadWordManagementService
    {
        private readonly IBadWordRepository _badWordRepository;
        private readonly IBadWordService _badWordService;

        public BadWordManagementService(IBadWordRepository badWordRepository, IBadWordService badWordService)
        {
            _badWordRepository = badWordRepository;
            _badWordService = badWordService;
        }

        public async Task<IEnumerable<BadWordDto>> GetAllBadWordsAsync(CancellationToken ct = default)
        {
            var badWords = await _badWordRepository.GetAllAsync(ct);
            return badWords.Select(bw => new BadWordDto
            {
                BadWordId = bw.BadWordId,
                Word = bw.Word,
                IsRegex = bw.IsRegex,
                Level = bw.Level,
                Category = bw.Category,
                IsActive = bw.IsActive
            });
        }

        public async Task<BadWordDto?> GetBadWordByIdAsync(int badWordId, CancellationToken ct = default)
        {
            var badWord = await _badWordRepository.GetByIdAsync(badWordId, ct);
            if (badWord == null)
                return null;

            return new BadWordDto
            {
                BadWordId = badWord.BadWordId,
                Word = badWord.Word,
                IsRegex = badWord.IsRegex,
                Level = badWord.Level,
                Category = badWord.Category,
                IsActive = badWord.IsActive
            };
        }

        public async Task<BadWordDto> CreateBadWordAsync(CreateBadWordRequest request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.Word))
                throw new ArgumentException("Từ cấm không được để trống.");

            if (request.Level < 1 || request.Level > 3)
                throw new ArgumentException("Level phải từ 1 đến 3.");

            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var badWord = new BadWord
            {
                Word = request.Word.Trim(),
                IsRegex = request.IsRegex,
                Level = request.Level,
                Category = request.Category?.Trim(),
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            var created = await _badWordRepository.AddAsync(badWord, ct);

            // Reload cache sau khi thêm mới
            await _badWordService.ReloadCacheAsync(ct);

            return new BadWordDto
            {
                BadWordId = created.BadWordId,
                Word = created.Word,
                IsRegex = created.IsRegex,
                Level = created.Level,
                Category = created.Category,
                IsActive = created.IsActive
            };
        }

        public async Task<BadWordDto> UpdateBadWordAsync(int badWordId, UpdateBadWordRequest request, CancellationToken ct = default)
        {
            var badWord = await _badWordRepository.GetByIdAsync(badWordId, ct);
            if (badWord == null)
                throw new KeyNotFoundException("Không tìm thấy từ cấm.");

            if (!string.IsNullOrWhiteSpace(request.Word))
                badWord.Word = request.Word.Trim();

            if (request.IsRegex.HasValue)
                badWord.IsRegex = request.IsRegex.Value;

            if (request.Level.HasValue)
            {
                if (request.Level.Value < 1 || request.Level.Value > 3)
                    throw new ArgumentException("Level phải từ 1 đến 3.");
                badWord.Level = request.Level.Value;
            }

            if (request.Category != null)
                badWord.Category = request.Category.Trim();

            if (request.IsActive.HasValue)
                badWord.IsActive = request.IsActive.Value;

            badWord.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            await _badWordRepository.UpdateAsync(badWord, ct);

            // Reload cache sau khi cập nhật
            await _badWordService.ReloadCacheAsync(ct);

            return new BadWordDto
            {
                BadWordId = badWord.BadWordId,
                Word = badWord.Word,
                IsRegex = badWord.IsRegex,
                Level = badWord.Level,
                Category = badWord.Category,
                IsActive = badWord.IsActive
            };
        }

        public async Task<bool> DeleteBadWordAsync(int badWordId, CancellationToken ct = default)
        {
            var badWord = await _badWordRepository.GetByIdAsync(badWordId, ct);
            if (badWord == null)
                throw new KeyNotFoundException("Không tìm thấy từ cấm.");

            await _badWordRepository.DeleteAsync(badWord, ct);

            // Reload cache sau khi xóa
            await _badWordService.ReloadCacheAsync(ct);

            return true;
        }

        public async Task ReloadCacheAsync(CancellationToken ct = default)
        {
            await _badWordService.ReloadCacheAsync(ct);
        }
    }
}

