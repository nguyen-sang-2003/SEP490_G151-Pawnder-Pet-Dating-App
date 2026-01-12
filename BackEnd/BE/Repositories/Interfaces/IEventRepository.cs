using BE.Models;

namespace BE.Repositories.Interfaces;

public interface IEventRepository : IBaseRepository<PetEvent>
{
    /// <summary>
    /// Lấy tất cả events (Admin) - bao gồm mọi trạng thái
    /// </summary>
    Task<IEnumerable<PetEvent>> GetAllEventsAsync(CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách events đang active hoặc sắp diễn ra
    /// </summary>
    Task<IEnumerable<PetEvent>> GetActiveEventsAsync(CancellationToken ct = default);

    /// <summary>
    /// Lấy event kèm danh sách submissions
    /// </summary>
    Task<PetEvent?> GetEventWithSubmissionsAsync(int eventId, CancellationToken ct = default);

    /// <summary>
    /// Lấy events cần chuyển trạng thái (background job)
    /// </summary>
    Task<IEnumerable<PetEvent>> GetEventsToTransitionAsync(CancellationToken ct = default);

    /// <summary>
    /// Lấy events theo status
    /// </summary>
    Task<IEnumerable<PetEvent>> GetEventsByStatusAsync(string status, CancellationToken ct = default);
}
