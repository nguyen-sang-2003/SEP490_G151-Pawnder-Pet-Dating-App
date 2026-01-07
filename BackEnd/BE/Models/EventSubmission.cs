using System;
using System.Collections.Generic;

namespace BE.Models;

/// <summary>
/// Bài dự thi trong sự kiện
/// </summary>
public partial class EventSubmission
{
    public int SubmissionId { get; set; }

    public int EventId { get; set; }

    public int UserId { get; set; }

    public int PetId { get; set; }

    /// <summary>
    /// URL ảnh/video dự thi
    /// </summary>
    public string MediaUrl { get; set; } = null!;

    /// <summary>
    /// Loại media: image, video
    /// </summary>
    public string MediaType { get; set; } = null!;

    public string? ThumbnailUrl { get; set; }

    public string? Caption { get; set; }

    /// <summary>
    /// Số lượt vote (denormalized để query nhanh)
    /// </summary>
    public int? VoteCount { get; set; }

    /// <summary>
    /// Thứ hạng sau khi tính kết quả (1, 2, 3...)
    /// </summary>
    public int? Rank { get; set; }

    public bool? IsWinner { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    // Navigation properties
    public virtual PetEvent Event { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual Pet Pet { get; set; } = null!;

    public virtual ICollection<EventVote> Votes { get; set; } = new List<EventVote>();
}
