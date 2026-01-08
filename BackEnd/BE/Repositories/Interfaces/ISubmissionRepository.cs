using BE.Models;

namespace BE.Repositories.Interfaces;

public interface ISubmissionRepository : IBaseRepository<EventSubmission>
{
    /// <summary>
    /// Lấy submissions của một event
    /// </summary>
    Task<IEnumerable<EventSubmission>> GetByEventIdAsync(int eventId, CancellationToken ct = default);

    /// <summary>
    /// Lấy bảng xếp hạng (sắp xếp theo vote count)
    /// </summary>
    Task<IEnumerable<EventSubmission>> GetLeaderboardAsync(int eventId, int top = 10, CancellationToken ct = default);

    /// <summary>
    /// Kiểm tra user đã submit vào event này chưa
    /// </summary>
    Task<bool> HasUserSubmittedAsync(int eventId, int userId, CancellationToken ct = default);

    /// <summary>
    /// Lấy submission với đầy đủ thông tin (user, pet, votes)
    /// </summary>
    Task<EventSubmission?> GetByIdWithDetailsAsync(int submissionId, CancellationToken ct = default);

    /// <summary>
    /// Kiểm tra user đã vote cho submission này chưa
    /// </summary>
    Task<bool> HasUserVotedAsync(int submissionId, int userId, CancellationToken ct = default);

    /// <summary>
    /// Thêm vote
    /// </summary>
    Task AddVoteAsync(int submissionId, int userId, CancellationToken ct = default);

    /// <summary>
    /// Xóa vote
    /// </summary>
    Task RemoveVoteAsync(int submissionId, int userId, CancellationToken ct = default);

    /// <summary>
    /// Cập nhật vote count (denormalized)
    /// </summary>
    Task UpdateVoteCountAsync(int submissionId, CancellationToken ct = default);
}
