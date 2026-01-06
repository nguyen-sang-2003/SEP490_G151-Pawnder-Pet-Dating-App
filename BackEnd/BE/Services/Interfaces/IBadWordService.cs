namespace BE.Services.Interfaces
{
    public interface IBadWordService
    {
        /// <summary>
        /// Kiểm tra và xử lý tin nhắn có chứa từ cấm
        /// </summary>
        /// <param name="message">Tin nhắn cần kiểm tra</param>
        /// <returns>Tuple: (isBlocked, filteredMessage, violationLevel)
        /// - isBlocked: true nếu tin nhắn bị chặn hoàn toàn (Level 2, 3)
        /// - filteredMessage: Tin nhắn sau khi đã filter (che từ Level 1)
        /// - violationLevel: Mức độ vi phạm cao nhất (0 = không vi phạm)
        /// </returns>
        Task<(bool isBlocked, string filteredMessage, int violationLevel)> CheckAndFilterMessageAsync(string message, CancellationToken ct = default);

        /// <summary>
        /// Normalize text để chống lách từ cấm (loại bỏ khoảng trắng, ký tự đặc biệt)
        /// </summary>
        string NormalizeText(string text);

        /// <summary>
        /// Reload cache từ database
        /// </summary>
        Task ReloadCacheAsync(CancellationToken ct = default);
    }
}

