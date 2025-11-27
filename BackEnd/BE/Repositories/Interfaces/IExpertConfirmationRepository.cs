using BE.DTO;
using BE.Models;

namespace BE.Repositories.Interfaces
{
    public interface IExpertConfirmationRepository : IBaseRepository<ExpertConfirmation>
    {
        Task<IEnumerable<ExpertConfirmationDTO>> GetAllExpertConfirmationsAsync(CancellationToken ct = default);
        Task<ExpertConfirmation?> GetExpertConfirmationAsync(int expertId, int userId, int chatId, CancellationToken ct = default);
        Task<IEnumerable<ExpertConfirmationDTO>> GetUserExpertConfirmationsAsync(int userId, CancellationToken ct = default);
        Task<ExpertConfirmation?> GetExpertConfirmationByUserAndChatAsync(int userId, int chatId, CancellationToken ct = default);
    }
}




