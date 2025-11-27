using BE.DTO;

namespace BE.Services.Interfaces
{
    public interface IExpertConfirmationService
    {
        Task<IEnumerable<ExpertConfirmationDTO>> GetAllExpertConfirmationsAsync(CancellationToken ct = default);
        Task<ExpertConfirmationDTO?> GetExpertConfirmationAsync(int expertId, int userId, int chatId, CancellationToken ct = default);
        Task<IEnumerable<ExpertConfirmationDTO>> GetUserExpertConfirmationsAsync(int userId, CancellationToken ct = default);
        Task<ExpertConfirmationResponseDTO> CreateExpertConfirmationAsync(int userId, int chatId, ExpertConfirmationCreateDTO dto, CancellationToken ct = default);
        Task<ExpertConfirmationResponseDTO> UpdateExpertConfirmationAsync(int expertId, int userId, int chatId, ExpertConfirmationUpdateDto dto, CancellationToken ct = default);
        Task<IEnumerable<object>> GetUserExpertChatsAsync(int userId, CancellationToken ct = default);
    }
}




