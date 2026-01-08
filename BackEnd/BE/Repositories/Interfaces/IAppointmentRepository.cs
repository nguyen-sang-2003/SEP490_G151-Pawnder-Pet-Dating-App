using BE.Models;

namespace BE.Repositories.Interfaces;

public interface IAppointmentRepository : IBaseRepository<PetAppointment>
{
    /// <summary>
    /// Lấy cuộc hẹn theo MatchId
    /// </summary>
    Task<IEnumerable<PetAppointment>> GetByMatchIdAsync(int matchId, CancellationToken ct = default);

    /// <summary>
    /// Lấy cuộc hẹn của user (cả inviter và invitee)
    /// </summary>
    Task<IEnumerable<PetAppointment>> GetByUserIdAsync(int userId, CancellationToken ct = default);

    /// <summary>
    /// Lấy cuộc hẹn theo trạng thái
    /// </summary>
    Task<IEnumerable<PetAppointment>> GetByStatusAsync(string status, CancellationToken ct = default);

    /// <summary>
    /// Lấy cuộc hẹn đầy đủ thông tin (include navigation properties)
    /// </summary>
    Task<PetAppointment?> GetByIdWithDetailsAsync(int appointmentId, CancellationToken ct = default);

    /// <summary>
    /// Lấy các cuộc hẹn sắp diễn ra cần gửi reminder
    /// </summary>
    Task<IEnumerable<PetAppointment>> GetUpcomingAppointmentsForReminderAsync(DateTime reminderTime, CancellationToken ct = default);

    /// <summary>
    /// Đếm số tin nhắn giữa 2 users trong một match
    /// </summary>
    Task<int> CountMessagesBetweenUsersAsync(int matchId, CancellationToken ct = default);

    /// <summary>
    /// Kiểm tra pet profile có đầy đủ không
    /// </summary>
    Task<bool> IsPetProfileCompleteAsync(int petId, CancellationToken ct = default);
}
