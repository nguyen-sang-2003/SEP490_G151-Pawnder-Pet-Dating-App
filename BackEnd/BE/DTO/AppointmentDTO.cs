using System.ComponentModel.DataAnnotations;

namespace BE.DTO;

#region Request DTOs

/// <summary>
/// DTO để tạo cuộc hẹn mới
/// </summary>
public class CreateAppointmentRequest
{
    [Required]
    public int MatchId { get; set; }

    [Required]
    public int InviterPetId { get; set; }

    [Required]
    public int InviteePetId { get; set; }

    [Required]
    public DateTime AppointmentDateTime { get; set; }

    public int? LocationId { get; set; }

    /// <summary>
    /// Custom location nếu không chọn từ danh sách có sẵn
    /// </summary>
    public CreateLocationRequest? CustomLocation { get; set; }

    /// <summary>
    /// Loại hoạt động: walk, cafe, playdate
    /// </summary>
    [Required]
    [StringLength(50)]
    public string ActivityType { get; set; } = null!;
}

/// <summary>
/// DTO để phản hồi cuộc hẹn (Accept/Decline)
/// </summary>
public class RespondAppointmentRequest
{
    [Required]
    public int AppointmentId { get; set; }

    /// <summary>
    /// true = Accept, false = Decline
    /// </summary>
    [Required]
    public bool Accept { get; set; }

    /// <summary>
    /// Lý do từ chối (bắt buộc nếu Decline)
    /// </summary>
    public string? DeclineReason { get; set; }
}

/// <summary>
/// DTO để đề xuất lại (Counter-Offer)
/// </summary>
public class CounterOfferRequest
{
    [Required]
    public int AppointmentId { get; set; }

    /// <summary>
    /// Thời gian mới đề xuất
    /// </summary>
    public DateTime? NewDateTime { get; set; }

    /// <summary>
    /// Địa điểm mới đề xuất
    /// </summary>
    public int? NewLocationId { get; set; }

    public CreateLocationRequest? NewCustomLocation { get; set; }
}

/// <summary>
/// DTO để hủy cuộc hẹn
/// </summary>
public class CancelAppointmentRequest
{
    [Required]
    public int AppointmentId { get; set; }

    [Required]
    public string Reason { get; set; } = null!;
}

/// <summary>
/// DTO để check-in bằng GPS
/// </summary>
public class CheckInRequest
{
    [Required]
    public int AppointmentId { get; set; }

    [Required]
    public decimal Latitude { get; set; }

    [Required]
    public decimal Longitude { get; set; }
}

/// <summary>
/// DTO để tạo địa điểm mới
/// </summary>
public class CreateLocationRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = null!;

    [Required]
    public string Address { get; set; } = null!;

    [Required]
    public decimal Latitude { get; set; }

    [Required]
    public decimal Longitude { get; set; }

    public string? City { get; set; }

    public string? District { get; set; }

    public string? PlaceType { get; set; }

    public string? GooglePlaceId { get; set; }
}

#endregion

#region Response DTOs

/// <summary>
/// DTO trả về thông tin cuộc hẹn
/// </summary>
public class AppointmentResponse
{
    public int AppointmentId { get; set; }
    public int MatchId { get; set; }

    // Inviter info
    public int InviterPetId { get; set; }
    public string? InviterPetName { get; set; }
    public int InviterUserId { get; set; }
    public string? InviterUserName { get; set; }

    // Invitee info
    public int InviteePetId { get; set; }
    public string? InviteePetName { get; set; }
    public int InviteeUserId { get; set; }
    public string? InviteeUserName { get; set; }

    // Appointment details
    public DateTime AppointmentDateTime { get; set; }
    public LocationResponse? Location { get; set; }
    public string ActivityType { get; set; } = null!;
    public string Status { get; set; } = null!;

    // Decision tracking
    public int? CurrentDecisionUserId { get; set; }
    public int CounterOfferCount { get; set; }

    // Check-in status
    public bool InviterCheckedIn { get; set; }
    public bool InviteeCheckedIn { get; set; }
    public DateTime? InviterCheckInTime { get; set; }
    public DateTime? InviteeCheckInTime { get; set; }

    // Cancellation info
    public int? CancelledBy { get; set; }
    public string? CancelReason { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO trả về thông tin địa điểm
/// </summary>
public class LocationResponse
{
    public int LocationId { get; set; }
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public bool IsPetFriendly { get; set; }
    public string? PlaceType { get; set; }
    public string? GooglePlaceId { get; set; }
}

/// <summary>
/// DTO cho card lời mời hiển thị trong chat
/// </summary>
public class AppointmentCardDto
{
    public int AppointmentId { get; set; }
    public string InviterPetName { get; set; } = null!;
    public string InviteePetName { get; set; } = null!;
    public DateTime AppointmentDateTime { get; set; }
    public string? LocationName { get; set; }
    public string ActivityType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public bool CanRespond { get; set; }
    public bool CanCounterOffer { get; set; }
    public bool CanCheckIn { get; set; }
}

#endregion
