namespace BE.Services.Interfaces
{
    public interface IPaymentHistoryService
    {
        Task<byte[]> GenerateQrAsync(decimal amount, string addInfo, CancellationToken ct = default);
        Task<object> CreatePaymentHistoryAsync(CreatePaymentHistoryRequest request, CancellationToken ct = default);
        Task<IEnumerable<object>> GetPaymentHistoriesByUserIdAsync(int userId, CancellationToken ct = default);
        Task<object> GetVipStatusAsync(int userId, CancellationToken ct = default);
    }

    public record CreatePaymentHistoryRequest
    {
        public int UserId { get; init; }
        public int DurationMonths { get; init; }
        public decimal Amount { get; init; }
        public string? PlanName { get; init; }
    }
}




