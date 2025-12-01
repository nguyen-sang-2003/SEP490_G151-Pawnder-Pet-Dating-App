namespace BE.Services.Interfaces
{
    public interface IDailyLimitService
    {
        Task<bool> CanPerformAction(int userId, string actionType);
        Task<bool> RecordAction(int userId, string actionType);
        Task<int> GetActionCountToday(int userId, string actionType);
        Task<int> GetRemainingCount(int userId, string actionType);
        Task<int> GetRemainingCountAsync(int userId, string actionType, CancellationToken ct = default);
        Task<int> GetFreeQuotaForAction(string actionType);
        Task<int> GetFreeTokensUsedToday(int userId);
        Task<bool> RecordTokenUsage(int userId, int tokensUsed);
    }
}




