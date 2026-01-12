using BE.DTO;
using BE.Models;

namespace BE.Services.Interfaces;

public interface IAppointmentService
{
    #region Pre-condition Checks

    /// <summary>
    /// Kiểm tra điều kiện tiên quyết để tạo cuộc hẹn
    /// </summary>
    Task<(bool IsValid, string? ErrorMessage)> ValidatePreConditionsAsync(
        int matchId, 
        int inviterPetId, 
        int inviteePetId, 
        CancellationToken ct = default);

    #endregion

    #region Appointment CRUD

    /// <summary>
    /// Tạo cuộc hẹn mới
    /// </summary>
    Task<AppointmentResponse> CreateAppointmentAsync(
        int userId, 
        CreateAppointmentRequest request, 
        CancellationToken ct = default);

    /// <summary>
    /// Lấy cuộc hẹn theo ID
    /// </summary>
    Task<AppointmentResponse?> GetAppointmentByIdAsync(int appointmentId, CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách cuộc hẹn theo MatchId
    /// </summary>
    Task<IEnumerable<AppointmentResponse>> GetAppointmentsByMatchIdAsync(int matchId, CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách cuộc hẹn của user
    /// </summary>
    Task<IEnumerable<AppointmentResponse>> GetAppointmentsByUserIdAsync(int userId, CancellationToken ct = default);

    #endregion

    #region Appointment Actions

    /// <summary>
    /// Accept hoặc Decline cuộc hẹn
    /// </summary>
    Task<AppointmentResponse> RespondToAppointmentAsync(
        int userId, 
        RespondAppointmentRequest request, 
        CancellationToken ct = default);

    /// <summary>
    /// Counter-offer (đề xuất lại thời gian/địa điểm)
    /// </summary>
    Task<AppointmentResponse> CounterOfferAsync(
        int userId, 
        CounterOfferRequest request, 
        CancellationToken ct = default);

    /// <summary>
    /// Hủy cuộc hẹn
    /// </summary>
    Task<AppointmentResponse> CancelAppointmentAsync(
        int userId, 
        CancelAppointmentRequest request, 
        CancellationToken ct = default);

    /// <summary>
    /// Check-in bằng GPS
    /// </summary>
    Task<AppointmentResponse> CheckInAsync(
        int userId, 
        CheckInRequest request, 
        CancellationToken ct = default);

    /// <summary>
    /// Kết thúc cuộc hẹn (user bấm thủ công)
    /// </summary>
    Task<AppointmentResponse> CompleteAppointmentAsync(
        int userId,
        int appointmentId,
        CancellationToken ct = default);

    /// <summary>
    /// Xử lý các cuộc hẹn quá hạn (gọi từ Background Service)
    /// - NO_SHOW: confirmed nhưng thiếu check-in sau 90 phút
    /// - AUTO_COMPLETE: on_going sau 90 phút
    /// </summary>
    Task ProcessExpiredAppointmentsAsync(CancellationToken ct = default);

    #endregion

    #region Location

    /// <summary>
    /// Tạo địa điểm mới
    /// </summary>
    Task<LocationResponse> CreateLocationAsync(CreateLocationRequest request, CancellationToken ct = default);

    /// <summary>
    /// Lấy danh sách địa điểm gần đây của user (từ các cuộc hẹn đã tạo)
    /// </summary>
    Task<IEnumerable<LocationResponse>> GetRecentLocationsAsync(int userId, int limit = 10, CancellationToken ct = default);

    #endregion
}
