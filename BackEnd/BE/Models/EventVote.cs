using System;

namespace BE.Models;

/// <summary>
/// Vote cho bài dự thi
/// </summary>
public partial class EventVote
{
    public int VoteId { get; set; }

    public int SubmissionId { get; set; }

    public int UserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    // Navigation properties
    public virtual EventSubmission Submission { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
