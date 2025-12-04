using System.Text.Json;

namespace BE.Services.Interfaces
{
    public interface IPaymentHistoryService
    {
        Task<byte[]> GenerateQrAsync(decimal amount, string addInfo, CancellationToken ct = default);
        Task<object> CreatePaymentHistoryAsync(CreatePaymentHistoryRequest request, CancellationToken ct = default);
        Task<IEnumerable<object>> GetPaymentHistoriesByUserIdAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetAllPaymentHistoriesAsync(CancellationToken ct = default);
        Task<object> GetVipStatusAsync(int userId, CancellationToken ct = default);
        Task<object> ProcessPaymentCallbackAsync(JsonElement notification, int userIdFromToken, CancellationToken ct = default);
        Task<object> CheckPaymentInLastHourAsync(int userId, decimal transferAmount, string content, CancellationToken ct = default);
        Task<bool> ValidateWebhookAsync(string? authHeader, CancellationToken ct = default);
    }

    public record CreatePaymentHistoryRequest
    {
        public int UserId { get; init; }
        public int DurationMonths { get; init; }
        public decimal Amount { get; init; }
        public string? PlanName { get; init; }
    }
}




