using System.ComponentModel.DataAnnotations;

namespace BE.DTO;

#region Request DTOs

/// <summary>
/// DTO để Admin tạo sự kiện mới
/// </summary>
public class CreateEventRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? CoverImageUrl { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime SubmissionDeadline { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    public string? PrizeDescription { get; set; }

    public int? PrizePoints { get; set; }
}

/// <summary>
/// DTO để Admin cập nhật sự kiện
/// </summary>
public class UpdateEventRequest
{
    [StringLength(200)]
    public string? Title { get; set; }

    public string? Description { get; set; }

    public string? CoverImageUrl { get; set; }

    public DateTime? StartTime { get; set; }

    public DateTime? SubmissionDeadline { get; set; }

    public DateTime? EndTime { get; set; }

    public string? PrizeDescription { get; set; }

    public int? PrizePoints { get; set; }
}

/// <summary>
/// DTO để User đăng bài dự thi
/// </summary>
public class SubmitEntryRequest
{
    [Required]
    public int EventId { get; set; }

    [Required]
    public int PetId { get; set; }

    [Required]
    public string MediaUrl { get; set; } = null!;

    [Required]
    public string MediaType { get; set; } = null!; // image/jpeg, image/png, video/mp4

    /// <summary>
    /// Kích thước file (bytes) - tối đa 50MB
    /// </summary>
    public long? MediaSize { get; set; }

    public string? ThumbnailUrl { get; set; }

    [StringLength(500)]
    public string? Caption { get; set; }
}

#endregion

#region Response DTOs

/// <summary>
/// DTO response cho danh sách sự kiện
/// </summary>
public class EventResponse
{
    public int EventId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime SubmissionDeadline { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = null!;
    public string? PrizeDescription { get; set; }
    public int PrizePoints { get; set; }
    public int SubmissionCount { get; set; }
    public int TotalVotes { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO response chi tiết sự kiện (bao gồm submissions)
/// </summary>
public class EventDetailResponse : EventResponse
{
    public string? CreatedByName { get; set; }
    public IEnumerable<SubmissionResponse>? Submissions { get; set; }
    public IEnumerable<SubmissionResponse>? Winners { get; set; }
}

/// <summary>
/// DTO response cho bài dự thi
/// </summary>
public class SubmissionResponse
{
    public int SubmissionId { get; set; }
    public int EventId { get; set; }
    
    // User info
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserAvatar { get; set; }
    
    // Pet info
    public int PetId { get; set; }
    public string? PetName { get; set; }
    public string? PetPhotoUrl { get; set; }
    
    // Media
    public string MediaUrl { get; set; } = null!;
    public string MediaType { get; set; } = null!;
    public string? ThumbnailUrl { get; set; }
    public string? Caption { get; set; }
    
    // Stats
    public int VoteCount { get; set; }
    public int? Rank { get; set; }
    public bool IsWinner { get; set; }
    
    // User interaction
    public bool HasVoted { get; set; } // Current user đã vote chưa
    public bool IsOwner { get; set; } // Current user là chủ bài này
    
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO cho bảng xếp hạng
/// </summary>
public class LeaderboardResponse
{
    public int Rank { get; set; }
    public SubmissionResponse Submission { get; set; } = null!;
}

#endregion
