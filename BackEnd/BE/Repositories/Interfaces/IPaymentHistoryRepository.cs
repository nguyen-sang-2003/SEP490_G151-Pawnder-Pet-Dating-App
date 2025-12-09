using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IPaymentHistoryRepository : IBaseRepository<PaymentHistory>
    {
        Task<IEnumerable<object>> GetPaymentHistoriesByUserIdAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<object>> GetAllPaymentHistoriesAsync(CancellationToken ct = default);
        Task<object?> GetVipStatusAsync(int userId, CancellationToken ct = default);
    }
}




