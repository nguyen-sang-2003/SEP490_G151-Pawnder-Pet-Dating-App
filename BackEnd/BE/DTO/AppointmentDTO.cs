using System.ComponentModel.DataAnnotations;

namespace BE.DTO;

#region Request DTOs

/// <summary>
/// DTO để tạo cuộc hẹn mới
/// </summary>
public class CreateAppointmentRequest
{
    [Required(ErrorMessage = "MatchId là bắt buộc")]
    [Range(1, int.MaxValue, ErrorMessage = "MatchId không hợp lệ")]
    public int MatchId { get; set; }

    [Required(ErrorMessage = "InviterPetId là bắt buộc")]
    [Range(1, int.MaxValue, ErrorMessage = "InviterPetId không hợp lệ")]
    public int InviterPetId { get; set; }

    [Required(ErrorMessage = "InviteePetId là bắt buộc")]
    [Range(1, int.MaxValue, ErrorMessage = "InviteePetId không hợp lệ")]
    public int InviteePetId { get; set; }

    [Required(ErrorMessage = "Thời gian hẹn là bắt buộc")]
    public DateTime AppointmentDateTime { get; set; }

    public int? LocationId { get; set; }

    /// <summary>
    /// Custom location nếu không chọn từ danh sách có sẵn
    /// </summary>
    public CreateLocationRequest? CustomLocation { get; set; }

    /// <summary>
    /// Loại hoạt động: walk, cafe, playdate
    /// </summary>
    [Required(ErrorMessage = "Loại hoạt động là bắt buộc")]
    [RegularExpression("^(walk|cafe|playdate|park|other)$", ErrorMessage = "Loại hoạt động không hợp lệ (walk, cafe, playdate, park, other)")]
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
    [Required(ErrorMessage = "AppointmentId là bắt buộc")]
    public int AppointmentId { get; set; }

    [Required(ErrorMessage = "Lý do hủy là bắt buộc")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Lý do hủy từ 5-500 ký tự")]
    public string Reason { get; set; } = null!;
}

/// <summary>
/// DTO để check-in bằng GPS
/// </summary>
public class CheckInRequest
{
    [Required(ErrorMessage = "AppointmentId là bắt buộc")]
    public int AppointmentId { get; set; }

    [Required(ErrorMessage = "Latitude là bắt buộc")]
    [Range(-90, 90, ErrorMessage = "Latitude phải từ -90 đến 90")]
    public decimal Latitude { get; set; }

    [Required(ErrorMessage = "Longitude là bắt buộc")]
    [Range(-180, 180, ErrorMessage = "Longitude phải từ -180 đến 180")]
    public decimal Longitude { get; set; }
}

/// <summary>
/// DTO để tạo địa điểm mới
/// </summary>
public class CreateLocationRequest
{
    [Required(ErrorMessage = "Tên địa điểm là bắt buộc")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Tên địa điểm từ 2-200 ký tự")]
    public string Name { get; set; } = null!;

    [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Địa chỉ từ 5-500 ký tự")]
    public string Address { get; set; } = null!;

    [Required(ErrorMessage = "Latitude là bắt buộc")]
    [Range(-90, 90, ErrorMessage = "Latitude phải từ -90 đến 90")]
    public decimal Latitude { get; set; }

    [Required(ErrorMessage = "Longitude là bắt buộc")]
    [Range(-180, 180, ErrorMessage = "Longitude phải từ -180 đến 180")]
    public decimal Longitude { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(100)]
    public string? District { get; set; }

    [StringLength(50)]
    public string? PlaceType { get; set; }

    [StringLength(255)]
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

    /// <summary>
    /// Cảnh báo: User có cuộc hẹn khác trùng giờ (không lưu DB, tính động)
    /// </summary>
    public bool HasConflict { get; set; }
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
