using BE.DTO;
using BE.Models;

namespace BE.Services.Interfaces;

public interface IEventService
{
    #region Admin Operations

    /// <summary>
    /// Lấy tất cả sự kiện (Admin only) - bao gồm mọi trạng thái
    /// </summary>
    Task<IEnumerable<EventResponse>> GetAllEventsAsync(CancellationToken ct = default);

    /// <summary>
    /// Tạo sự kiện mới (Admin only)
    /// </summary>
    Task<EventResponse> CreateEventAsync(int adminId, CreateEventRequest request, CancellationToken ct = default);

    /// <summary>
    /// Cập nhật sự kiện (Admin only)
    /// </summary>
    Task<EventResponse> UpdateEventAsync(int eventId, UpdateEventRequest request, CancellationToken ct = default);

    /// <summary>
    /// Hủy sự kiện (Admin only)
    /// </summary>
    Task CancelEventAsync(int eventId, string? reason, CancellationToken ct = default);

    #endregion

    #region User Operations

    /// <summary>
    /// Lấy danh sách events đang hoạt động
    /// </summary>
    Task<IEnumerable<EventResponse>> GetActiveEventsAsync(CancellationToken ct = default);

    /// <summary>
    /// Lấy chi tiết event (bao gồm submissions)
    /// </summary>
    Task<EventDetailResponse?> GetEventByIdAsync(int eventId, int? currentUserId = null, CancellationToken ct = default);

    /// <summary>
    /// Đăng bài dự thi
    /// </summary>
    Task<SubmissionResponse> SubmitEntryAsync(int userId, SubmitEntryRequest request, CancellationToken ct = default);

    /// <summary>
    /// Vote cho bài dự thi
    /// </summary>
    Task VoteAsync(int userId, int submissionId, CancellationToken ct = default);

    /// <summary>
    /// Bỏ vote
    /// </summary>
    Task UnvoteAsync(int userId, int submissionId, CancellationToken ct = default);

    /// <summary>
    /// Lấy bảng xếp hạng
    /// </summary>
    Task<IEnumerable<LeaderboardResponse>> GetLeaderboardAsync(int eventId, int? currentUserId = null, CancellationToken ct = default);

    #endregion

    #region Background Job

    /// <summary>
    /// Xử lý chuyển trạng thái events (background job)
    /// </summary>
    Task ProcessEventTransitionsAsync(CancellationToken ct = default);

    /// <summary>
    /// Tính kết quả và trao giải cho event đã kết thúc
    /// </summary>
    Task ProcessEventResultsAsync(int eventId, CancellationToken ct = default);

    #endregion
}
