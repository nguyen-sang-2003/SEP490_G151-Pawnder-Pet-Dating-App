namespace BE.Services.Interfaces
{
    public interface IPetRecommendationService
    {
        Task<object> RecommendPetsAsync(int userId, CancellationToken ct = default);
        Task<object> RecommendPetsForPetAsync(int preferenceUserId, int targetPetId, CancellationToken ct = default);
    }
}




