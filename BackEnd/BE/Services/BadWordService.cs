using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Text.RegularExpressions;

namespace BE.Services
{
    public class BadWordService : IBadWordService
    {
        private readonly IBadWordRepository _badWordRepository;
        private readonly IMemoryCache _cache;
        private const string CACHE_KEY = "BadWords_Active";
        private const int CACHE_DURATION_MINUTES = 30;

        public BadWordService(IBadWordRepository badWordRepository, IMemoryCache cache)
        {
            _badWordRepository = badWordRepository;
            _cache = cache;
        }

        public async Task<(bool isBlocked, string filteredMessage, int violationLevel)> CheckAndFilterMessageAsync(string message, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(message))
                return (false, message, 0);

            // Load bad words từ cache
            var badWords = await GetCachedBadWordsAsync(ct);

            if (!badWords.Any())
                return (false, message, 0);

            // Normalize message để chống lách
            string normalizedMessage = NormalizeText(message);
            int maxViolationLevel = 0;
            bool shouldBlock = false;
            string filteredMessage = message;

            // Kiểm tra từng từ cấm
            foreach (var badWord in badWords)
            {
                bool isMatch = false;

                if (badWord.IsRegex)
                {
                    try
                    {
                        // Sử dụng regex pattern
                        var regex = new Regex(badWord.Word, RegexOptions.IgnoreCase | RegexOptions.Compiled);
                        isMatch = regex.IsMatch(normalizedMessage);
                    }
                    catch (Exception ex)
                    {
                        // Nếu regex không hợp lệ, bỏ qua
                        Console.WriteLine($"[BadWordService] Invalid regex pattern: {badWord.Word}, Error: {ex.Message}");
                        continue;
                    }
                }
                else
                {
                    // Kiểm tra text thường - normalize cả hai để so sánh
                    string normalizedWord = NormalizeText(badWord.Word);
                    isMatch = normalizedMessage.Contains(normalizedWord, StringComparison.OrdinalIgnoreCase);
                }

                if (isMatch)
                {
                    maxViolationLevel = Math.Max(maxViolationLevel, badWord.Level);

                    // Level 2, 3: Block hoàn toàn
                    if (badWord.Level >= 2)
                    {
                        shouldBlock = true;
                    }
                    else if (badWord.Level == 1)
                    {
                        // Level 1: Che từ (thay bằng ***)
                        if (badWord.IsRegex)
                        {
                            try
                            {
                                var regex = new Regex(badWord.Word, RegexOptions.IgnoreCase);
                                filteredMessage = regex.Replace(filteredMessage, "***");
                            }
                            catch
                            {
                                // Nếu regex không hợp lệ, bỏ qua
                            }
                        }
                        else
                        {
                            // Tạo pattern linh hoạt để bắt các biến thể có khoảng trắng hoặc ký tự đặc biệt giữa các ký tự
                            string flexiblePattern = CreateFlexiblePattern(badWord.Word);
                            try
                            {
                                var regex = new Regex(flexiblePattern, RegexOptions.IgnoreCase);
                                filteredMessage = regex.Replace(filteredMessage, "***");
                            }
                            catch
                            {
                                // Fallback: thay thế đơn giản nếu regex lỗi
                                var simpleRegex = new Regex(Regex.Escape(badWord.Word), RegexOptions.IgnoreCase);
                                filteredMessage = simpleRegex.Replace(filteredMessage, "***");
                            }
                        }
                    }
                }
            }

            return (shouldBlock, filteredMessage, maxViolationLevel);
        }

        public string NormalizeText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Chuyển về lowercase để so sánh (xử lý cả unicode)
            string normalized = text.ToLowerInvariant();

            // Loại bỏ tất cả các loại khoảng trắng (space, tab, newline, unicode spaces, non-breaking space)
            normalized = Regex.Replace(normalized, @"\s+", "");

            // Loại bỏ các ký tự đặc biệt thường dùng để lách
            // Bao gồm: dấu câu, ký tự đặc biệt, ký tự toán học, ký tự tiền tệ
            normalized = Regex.Replace(normalized, @"[.,_\-\/|\\*&%$#@!()\[\]{}\+\=\<\>\?\:\;\""\'~`]", "");

            // Loại bỏ zero-width characters (zero-width space, zero-width non-joiner, zero-width joiner, word joiner)
            normalized = Regex.Replace(normalized, @"[\u200B-\u200D\uFEFF\u2060]", "");

            // Loại bỏ các ký tự điều khiển và ký tự không in được
            normalized = Regex.Replace(normalized, @"[\u0000-\u001F\u007F-\u009F]", "");

            // Loại bỏ ký tự lặp lại (ví dụ: aaa -> a, đmmmm -> đm)
            // Giữ lại tối đa 2 ký tự lặp liên tiếp
            normalized = Regex.Replace(normalized, @"(.)\1{2,}", "$1$1");

            // Chuẩn hóa các ký tự thay thế phổ biến (số thay chữ)
            normalized = normalized.Replace('0', 'o')
                                   .Replace('1', 'i')
                                   .Replace('3', 'e')
                                   .Replace('4', 'a')
                                   .Replace('5', 's')
                                   .Replace('7', 't')
                                   .Replace('@', 'a')
                                   .Replace('$', 's')
                                   .Replace('!', 'i');

            return normalized;
        }

        /// <summary>
        /// Tạo regex pattern linh hoạt để match từ cấm với các biến thể có thể xảy ra
        /// Xử lý: khoảng trắng, ký tự đặc biệt, zero-width characters
        /// </summary>
        private string CreateFlexiblePattern(string word)
        {
            if (string.IsNullOrWhiteSpace(word))
                return string.Empty;

            // Escape các ký tự đặc biệt trong regex để tránh conflict với regex syntax
            string escaped = Regex.Escape(word.ToLowerInvariant());
            
            // Tạo pattern cho phép có các ký tự phân cách giữa các ký tự của từ cấm:
            // - \s: Khoảng trắng (space, tab, newline, unicode spaces)
            // - \W: Ký tự không phải word (dấu câu, ký tự đặc biệt)
            // - \u200B-\u200D\uFEFF: Zero-width characters
            // Pattern: mỗi ký tự có thể có [\s\W\u200B-\u200D\uFEFF]* (0 hoặc nhiều) ở giữa
            string pattern = string.Join(@"[\s\W\u200B-\u200D\uFEFF]*", escaped.ToCharArray());
            
            return pattern;
        }

        public async Task ReloadCacheAsync(CancellationToken ct = default)
        {
            _cache.Remove(CACHE_KEY);
            await GetCachedBadWordsAsync(ct);
        }

        private async Task<IEnumerable<BadWord>> GetCachedBadWordsAsync(CancellationToken ct = default)
        {
            if (_cache.TryGetValue(CACHE_KEY, out IEnumerable<BadWord>? cachedBadWords) && cachedBadWords != null)
            {
                return cachedBadWords;
            }

            // Load từ database
            var badWords = await _badWordRepository.GetActiveBadWordsAsync(ct);

            // Cache trong 30 phút
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CACHE_DURATION_MINUTES),
                SlidingExpiration = TimeSpan.FromMinutes(10)
            };

            _cache.Set(CACHE_KEY, badWords, cacheOptions);

            return badWords;
        }
    }
}

