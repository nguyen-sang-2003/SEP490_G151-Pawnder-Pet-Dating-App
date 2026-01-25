using System;
using System.Collections.Generic;

namespace BE.Models;

/// <summary>
/// Cuộc hẹn gặp giữa 2 thú cưng đã match
/// </summary>
public partial class PetAppointment
{
    public int AppointmentId { get; set; }

    /// <summary>
    /// Reference tới ChatUser (Match) giữa 2 pets
    /// </summary>
    public int MatchId { get; set; }

    public int InviterPetId { get; set; }

    public int InviteePetId { get; set; }

    public int InviterUserId { get; set; }

    public int InviteeUserId { get; set; }

    /// <summary>
    /// Thời gian hẹn gặp
    /// </summary>
    public DateTime AppointmentDateTime { get; set; }

    public int? LocationId { get; set; }

    /// <summary>
    /// Loại hoạt động: walk, cafe, playdate
    /// </summary>
    public string ActivityType { get; set; } = null!;

    /// <summary>
    /// Trạng thái: pending, confirmed, rejected, cancelled, on_going, completed, no_show
    /// </summary>
    public string Status { get; set; } = "pending";

    /// <summary>
    /// User hiện đang có quyền Accept/Decline/Counter-offer
    /// </summary>
    public int? CurrentDecisionUserId { get; set; }

    /// <summary>
    /// Số lần counter-offer (giới hạn 3)
    /// </summary>
    public int? CounterOfferCount { get; set; }

    // Check-in tracking
    public bool? InviterCheckedIn { get; set; }

    public bool? InviteeCheckedIn { get; set; }

    public DateTime? InviterCheckInTime { get; set; }

    public DateTime? InviteeCheckInTime { get; set; }

    // Cancellation info
    public int? CancelledBy { get; set; }

    public string? CancelReason { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ChatUser Match { get; set; } = null!;

    public virtual Pet InviterPet { get; set; } = null!;

    public virtual Pet InviteePet { get; set; } = null!;

    public virtual User InviterUser { get; set; } = null!;

    public virtual User InviteeUser { get; set; } = null!;

    public virtual User? CurrentDecisionUser { get; set; }

    public virtual User? CancelledByUser { get; set; }

    public virtual PetAppointmentLocation? Location { get; set; }
}
