namespace BE.Services.Interfaces
{
    public interface IDailyLimitService
    {
        Task<int> GetRemainingCountAsync(int userId, string actionType, CancellationToken ct = default);
    }
}




