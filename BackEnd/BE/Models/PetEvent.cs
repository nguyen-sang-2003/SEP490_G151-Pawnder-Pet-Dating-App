using System;
using System.Collections.Generic;

namespace BE.Models;

/// <summary>
/// Sự kiện cuộc thi ảnh/video thú cưng
/// </summary>
public partial class PetEvent
{
    public int EventId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? CoverImageUrl { get; set; }

    /// <summary>
    /// Thời gian bắt đầu sự kiện
    /// </summary>
    public DateTime StartTime { get; set; }

    /// <summary>
    /// Thời gian đóng nhận bài dự thi
    /// </summary>
    public DateTime SubmissionDeadline { get; set; }

    /// <summary>
    /// Thời gian kết thúc (đóng vote + tính kết quả)
    /// </summary>
    public DateTime EndTime { get; set; }

    /// <summary>
    /// Trạng thái: upcoming, active, submission_closed, voting_ended, completed, cancelled
    /// </summary>
    public string Status { get; set; } = "upcoming";

    public string? PrizeDescription { get; set; }

    public int? PrizePoints { get; set; }

    public int CreatedBy { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual User CreatedByUser { get; set; } = null!;

    public virtual ICollection<EventSubmission> Submissions { get; set; } = new List<EventSubmission>();
}
