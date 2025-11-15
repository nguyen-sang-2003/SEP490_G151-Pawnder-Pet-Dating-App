namespace BE.Services.Interfaces
{
    public interface IMatchService
    {
        Task<IEnumerable<object>> GetLikesReceivedAsync(int userId, int? petId, CancellationToken ct = default);
        Task<object> GetStatsAsync(int userId, CancellationToken ct = default);
        Task<object> SendLikeAsync(LikeRequest request, CancellationToken ct = default);
        Task<object> RespondToLikeAsync(RespondRequest request, CancellationToken ct = default);
        Task<object> GetBadgeCountsAsync(int userId, int? petId, CancellationToken ct = default);
    }
}

// DTOs for Match operations
namespace BE.Services.Interfaces
{
    public class LikeRequest
    {
        public int FromUserId { get; set; }
        public int ToUserId { get; set; }
        public int FromPetId { get; set; }
        public int ToPetId { get; set; }
    }

    public class RespondRequest
    {
        public int MatchId { get; set; }
        public string Action { get; set; } = null!;
    }
}

