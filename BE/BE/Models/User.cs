using System;
using System.Collections.Generic;

namespace BE.Models;

public partial class User
{
    public int UserId { get; set; }

    public int? RoleId { get; set; }

    public int? UserStatusId { get; set; }

    public int? AddressId { get; set; }

    public string? FullName { get; set; }

    public string? Gender { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? ProviderLogin { get; set; }

    public string? TokenJwt { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
    public bool IsProfileComplete { get; set; } = false;   // <-- thêm

    public virtual Address? Address { get; set; }

    public virtual ICollection<Block> BlockFromUsers { get; set; } = new List<Block>();

    public virtual ICollection<Block> BlockToUsers { get; set; } = new List<Block>();

    public virtual ICollection<ChatAi> ChatAis { get; set; } = new List<ChatAi>();

    public virtual ICollection<ChatUserContent> ChatUserContents { get; set; } = new List<ChatUserContent>();

    public virtual ICollection<ChatUser> ChatUserFromUsers { get; set; } = new List<ChatUser>();

    public virtual ICollection<ChatUser> ChatUserToUsers { get; set; } = new List<ChatUser>();

    public virtual ICollection<DailyLimit> DailyLimits { get; set; } = new List<DailyLimit>();

    public virtual ICollection<ExpertConfirmation> ExpertConfirmationExperts { get; set; } = new List<ExpertConfirmation>();

    public virtual ICollection<ExpertConfirmation> ExpertConfirmationUsers { get; set; } = new List<ExpertConfirmation>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<PaymentHistory> PaymentHistories { get; set; } = new List<PaymentHistory>();

    public virtual ICollection<Pet> Pets { get; set; } = new List<Pet>();

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    public virtual Role? Role { get; set; }

    public virtual ICollection<UserPreference> UserPreferences { get; set; } = new List<UserPreference>();

    public virtual UserStatus? UserStatus { get; set; }
}
