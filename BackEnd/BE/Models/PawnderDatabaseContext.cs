using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace BE.Models;

public partial class PawnderDatabaseContext : DbContext
{
    public PawnderDatabaseContext()
    {
    }

    public PawnderDatabaseContext(DbContextOptions<PawnderDatabaseContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<Attribute> Attributes { get; set; }

    public virtual DbSet<BadWord> BadWords { get; set; }

    public virtual DbSet<AttributeOption> AttributeOptions { get; set; }

    public virtual DbSet<Block> Blocks { get; set; }

    public virtual DbSet<ChatAi> ChatAis { get; set; }

    public virtual DbSet<ChatAicontent> ChatAicontents { get; set; }

    public virtual DbSet<ChatExpert> ChatExperts { get; set; }

    public virtual DbSet<ChatExpertContent> ChatExpertContents { get; set; }

    public virtual DbSet<ChatUser> ChatUsers { get; set; }

    public virtual DbSet<ChatUserContent> ChatUserContents { get; set; }

    public virtual DbSet<DailyLimit> DailyLimits { get; set; }

    public virtual DbSet<ExpertConfirmation> ExpertConfirmations { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<PaymentHistory> PaymentHistories { get; set; }

    public virtual DbSet<Pet> Pets { get; set; }

    public virtual DbSet<PetCharacteristic> PetCharacteristics { get; set; }

    public virtual DbSet<PetPhoto> PetPhotos { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserBanHistory> UserBanHistories { get; set; }

    public virtual DbSet<UserPreference> UserPreferences { get; set; }

    public virtual DbSet<UserStatus> UserStatuses { get; set; }

    public virtual DbSet<PetAppointment> PetAppointments { get; set; }

    public virtual DbSet<PetAppointmentLocation> PetAppointmentLocations { get; set; }

    public virtual DbSet<PetEvent> PetEvents { get; set; }

    public virtual DbSet<EventSubmission> EventSubmissions { get; set; }

    public virtual DbSet<EventVote> EventVotes { get; set; }
    public virtual DbSet<Policy> Policies { get; set; }

    public virtual DbSet<PolicyVersion> PolicyVersions { get; set; }

    public virtual DbSet<UserPolicyAccept> UserPolicyAccepts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("Address_pkey");

            entity.ToTable("Address");

            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.District).HasMaxLength(100);
            entity.Property(e => e.Latitude).HasPrecision(9, 6);
            entity.Property(e => e.Longitude).HasPrecision(9, 6);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Ward).HasMaxLength(100);
        });

        modelBuilder.Entity<Attribute>(entity =>
        {
            entity.HasKey(e => e.AttributeId).HasName("Attribute_pkey");

            entity.ToTable("Attribute");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Percent)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("0");
            entity.Property(e => e.TypeValue).HasMaxLength(50);
            entity.Property(e => e.Unit).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
        });

        modelBuilder.Entity<AttributeOption>(entity =>
        {
            entity.HasKey(e => e.OptionId).HasName("AttributeOption_pkey");

            entity.ToTable("AttributeOption");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.Attribute).WithMany(p => p.AttributeOptions)
                .HasForeignKey(d => d.AttributeId)
                .HasConstraintName("AttributeOption_AttributeId_fkey");
        });

        modelBuilder.Entity<Block>(entity =>
        {
            entity.HasKey(e => new { e.FromUserId, e.ToUserId }).HasName("Block_pkey");

            entity.ToTable("Block");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.FromUser).WithMany(p => p.BlockFromUsers)
                .HasForeignKey(d => d.FromUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Block_FromUserId_fkey");

            entity.HasOne(d => d.ToUser).WithMany(p => p.BlockToUsers)
                .HasForeignKey(d => d.ToUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Block_ToUserId_fkey");
        });

        modelBuilder.Entity<ChatAi>(entity =>
        {
            entity.HasKey(e => e.ChatAiid).HasName("ChatAI_pkey");

            entity.ToTable("ChatAI");

            entity.Property(e => e.ChatAiid).HasColumnName("ChatAIId");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.User).WithMany(p => p.ChatAis)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("ChatAI_UserId_fkey");
        });

        modelBuilder.Entity<ChatAicontent>(entity =>
        {
            entity.HasKey(e => e.ContentId).HasName("ChatAIContent_pkey");

            entity.ToTable("ChatAIContent");

            entity.Property(e => e.ChatAiid).HasColumnName("ChatAIId");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.ChatAi).WithMany(p => p.ChatAicontents)
                .HasForeignKey(d => d.ChatAiid)
                .HasConstraintName("ChatAIContent_ChatAIId_fkey");
        });

        modelBuilder.Entity<ChatExpert>(entity =>
        {
            entity.HasKey(e => e.ChatExpertId).HasName("ChatExpert_pkey");

            entity.ToTable("ChatExpert");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.Expert).WithMany(p => p.ChatExpertExperts)
                .HasForeignKey(d => d.ExpertId)
                .HasConstraintName("ChatExpert_ExpertId_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.ChatExpertUsers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("ChatExpert_UserId_fkey");
        });

        modelBuilder.Entity<ChatExpertContent>(entity =>
        {
            entity.HasKey(e => e.ContentId).HasName("ChatExpertContent_pkey");

            entity.ToTable("ChatExpertContent");

            entity.Property(e => e.ChatAiid).HasColumnName("ChatAIId");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.ChatExpert).WithMany(p => p.ChatExpertContents)
                .HasForeignKey(d => d.ChatExpertId)
                .HasConstraintName("ChatExpertContent_ChatExpertId_fkey");

            entity.HasOne(d => d.From).WithMany(p => p.ChatExpertContents)
                .HasForeignKey(d => d.FromId)
                .HasConstraintName("ChatExpertContent_FromId_fkey");

            entity.HasOne(d => d.ExpertConfirmation).WithMany(p => p.ChatExpertContents)
                .HasForeignKey(d => new { d.ExpertId, d.UserId, d.ChatAiid })
                .HasConstraintName("ChatExpertContent_ExpertId_UserId_ChatAIId_fkey");
        });

        modelBuilder.Entity<ChatUser>(entity =>
        {
            entity.HasKey(e => e.MatchId).HasName("ChatUser_pkey");

            entity.ToTable("ChatUser");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.FromPet).WithMany(p => p.ChatUserFromPets)
                .HasForeignKey(d => d.FromPetId)
                .HasConstraintName("ChatUser_FromPetId_fkey");

            entity.HasOne(d => d.ToPet).WithMany(p => p.ChatUserToPets)
                .HasForeignKey(d => d.ToPetId)
                .HasConstraintName("ChatUser_ToPetId_fkey");
        });

        modelBuilder.Entity<ChatUserContent>(entity =>
        {
            entity.HasKey(e => e.ContentId).HasName("ChatUserContent_pkey");

            entity.ToTable("ChatUserContent");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.FromUser).WithMany(p => p.ChatUserContents)
                .HasForeignKey(d => d.FromUserId)
                .HasConstraintName("ChatUserContent_FromUserId_fkey");

            entity.HasOne(d => d.FromPet).WithMany(p => p.ChatUserContents)
                .HasForeignKey(d => d.FromPetId)
                .HasConstraintName("ChatUserContent_FromPetId_fkey");

            entity.HasOne(d => d.Match).WithMany(p => p.ChatUserContents)
                .HasForeignKey(d => d.MatchId)
                .HasConstraintName("ChatUserContent_MatchId_fkey");
        });

        modelBuilder.Entity<DailyLimit>(entity =>
        {
            entity.HasKey(e => e.LimitId).HasName("DailyLimit_pkey");

            entity.ToTable("DailyLimit");

            entity.HasIndex(e => new { e.UserId, e.ActionType, e.ActionDate }, "DailyLimit_UserId_ActionType_ActionDate_key").IsUnique();

            entity.Property(e => e.ActionType).HasMaxLength(100);
            entity.Property(e => e.Count).HasDefaultValue(1);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.User).WithMany(p => p.DailyLimits)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("DailyLimit_UserId_fkey");
        });

        modelBuilder.Entity<ExpertConfirmation>(entity =>
        {
            entity.HasKey(e => new { e.ExpertId, e.UserId, e.ChatAiid }).HasName("ExpertConfirmation_pkey");

            entity.ToTable("ExpertConfirmation");

            entity.Property(e => e.ChatAiid).HasColumnName("ChatAIId");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.ChatAi).WithMany(p => p.ExpertConfirmations)
                .HasForeignKey(d => d.ChatAiid)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ExpertConfirmation_ChatAIId_fkey");

            entity.HasOne(d => d.Expert).WithMany(p => p.ExpertConfirmationExperts)
                .HasForeignKey(d => d.ExpertId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ExpertConfirmation_ExpertId_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.ExpertConfirmationUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ExpertConfirmation_UserId_fkey");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("Notification_pkey");

            entity.ToTable("Notification");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Type)
                .HasColumnName("Type")
                .HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("SENT");
            entity.Property(e => e.IsBroadcast)
                .HasDefaultValue(false);
            entity.Property(e => e.IsRead)
                .HasColumnName("IsRead")
                .HasDefaultValue(false);
            entity.Property(e => e.SentAt)
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Notification_UserId_fkey");

            entity.HasOne(d => d.CreatedByUser).WithMany()
                .HasForeignKey(d => d.CreatedByUserId)
                .HasConstraintName("Notification_CreatedByUserId_fkey");

            // Indexes
            entity.HasIndex(e => new { e.UserId, e.IsRead })
                .HasDatabaseName("IX_Notification_UserId_IsRead");
            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_Notification_Status");
        });

        modelBuilder.Entity<PaymentHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("PaymentHistory_pkey");

            entity.ToTable("PaymentHistory");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.StatusService).HasMaxLength(100);
           
            entity.Property(e => e.Amount).HasPrecision(10, 2);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.User).WithMany(p => p.PaymentHistories)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("PaymentHistory_UserId_fkey");
        });

        modelBuilder.Entity<Pet>(entity =>
        {
            entity.HasKey(e => e.PetId).HasName("Pet_pkey");

            entity.ToTable("Pet");

            entity.Property(e => e.Breed).HasMaxLength(100);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.IsActive).HasDefaultValue(false);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.User).WithMany(p => p.Pets)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("Pet_UserId_fkey");
        });

        modelBuilder.Entity<PetCharacteristic>(entity =>
        {
            entity.HasKey(e => new { e.PetId, e.AttributeId }).HasName("PetCharacteristic_pkey");

            entity.ToTable("PetCharacteristic");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.Attribute).WithMany(p => p.PetCharacteristics)
                .HasForeignKey(d => d.AttributeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("PetCharacteristic_AttributeId_fkey");

            entity.HasOne(d => d.Option).WithMany(p => p.PetCharacteristics)
                .HasForeignKey(d => d.OptionId)
                .HasConstraintName("PetCharacteristic_OptionId_fkey");

            entity.HasOne(d => d.Pet).WithMany(p => p.PetCharacteristics)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("PetCharacteristic_PetId_fkey");
        });

        modelBuilder.Entity<PetPhoto>(entity =>
        {
            entity.HasKey(e => e.PhotoId).HasName("PetPhoto_pkey");
            entity.ToTable("PetPhoto");

            // Columns
            entity.Property(e => e.ImageUrl)                // bắt buộc có URL ảnh
                .IsRequired()
                .HasColumnType("text");

            entity.Property(e => e.PublicId)           // Cloudinary public_id (có thể null)
                .HasColumnType("text");

            entity.Property(e => e.IsPrimary)
                .HasDefaultValue(false);

            entity.Property(e => e.SortOrder)
                .HasDefaultValue(0);

            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            // Relations
            entity.HasOne(d => d.Pet)
                .WithMany(p => p.PetPhotos)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.Cascade)                // xóa Pet -> xóa luôn ảnh (hard delete)
                .HasConstraintName("PetPhoto_PetId_fkey");

            // Indexes
            entity.HasIndex(e => e.PetId)
                .HasDatabaseName("IX_PetPhoto_PetId");

            // Đảm bảo MỖI pet chỉ có 1 ảnh primary (chưa bị xóa)
            entity.HasIndex(e => new { e.PetId, e.IsPrimary })
                .HasDatabaseName("UX_PetPhoto_OnePrimaryPerPet")
                .IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");   // PostgreSQL filtered index
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.ReportId).HasName("Report_pkey");

            entity.ToTable("Report");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.Content).WithMany(p => p.Reports)
                .HasForeignKey(d => d.ContentId)
                .HasConstraintName("Report_ContentId_fkey");

            entity.HasOne(d => d.UserReport).WithMany(p => p.Reports)
                .HasForeignKey(d => d.UserReportId)
                .HasConstraintName("Report_UserReportId_fkey");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("Role_pkey");

            entity.ToTable("Role");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.RoleName).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("User_pkey");

            entity.ToTable("User");

            entity.HasIndex(e => e.Email, "User_Email_key").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.ProviderLogin).HasMaxLength(50);
            entity.Property(e => e.TokenJwt).HasColumnName("TokenJWT");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IsProfileComplete)       // <-- thêm
         .HasDefaultValue(false)
         .IsRequired();
            entity.HasOne(d => d.Address).WithMany(p => p.Users)
                .HasForeignKey(d => d.AddressId)
                .HasConstraintName("User_AddressId_fkey");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .HasConstraintName("User_RoleId_fkey");

            entity.HasOne(d => d.UserStatus).WithMany(p => p.Users)
                .HasForeignKey(d => d.UserStatusId)
                .HasConstraintName("User_UserStatusId_fkey");
        });

        modelBuilder.Entity<UserBanHistory>(entity =>
        {
            entity.HasKey(e => e.BanId).HasName("UserBanHistory_pkey");

            entity.ToTable("UserBanHistory");

            entity.Property(e => e.BanEnd).HasColumnType("timestamp without time zone");
            entity.Property(e => e.BanStart)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.User).WithMany(p => p.UserBanHistories)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("UserBanHistory_UserId_fkey");
        });

        modelBuilder.Entity<UserPreference>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.AttributeId }).HasName("UserPreference_pkey");

            entity.ToTable("UserPreference");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.Attribute).WithMany(p => p.UserPreferences)
                .HasForeignKey(d => d.AttributeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("UserPreference_AttributeId_fkey");

            entity.HasOne(d => d.Option).WithMany(p => p.UserPreferences)
                .HasForeignKey(d => d.OptionId)
                .HasConstraintName("UserPreference_OptionId_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.UserPreferences)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("UserPreference_UserId_fkey");
        });

        modelBuilder.Entity<UserStatus>(entity =>
        {
            entity.HasKey(e => e.UserStatusId).HasName("UserStatus_pkey");

            entity.ToTable("UserStatus");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UserStatusName).HasMaxLength(50);
        });

        // PetAppointmentLocation configuration
        modelBuilder.Entity<PetAppointmentLocation>(entity =>
        {
            entity.HasKey(e => e.LocationId).HasName("PetAppointmentLocation_pkey");

            entity.ToTable("PetAppointmentLocation");

            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Latitude).HasPrecision(9, 6);
            entity.Property(e => e.Longitude).HasPrecision(9, 6);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.District).HasMaxLength(100);
            entity.Property(e => e.IsPetFriendly).HasDefaultValue(true);
            entity.Property(e => e.PlaceType).HasMaxLength(50);
            entity.Property(e => e.GooglePlaceId).HasMaxLength(255);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
        });

        // BadWord configuration
        modelBuilder.Entity<BadWord>(entity =>
        {
            entity.HasKey(e => e.BadWordId).HasName("BadWord_pkey");

            entity.ToTable("BadWord");

            entity.Property(e => e.Word).HasMaxLength(200).IsRequired();
            entity.Property(e => e.IsRegex).HasDefaultValue(false);
            entity.Property(e => e.Level).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            // Index for performance
            entity.HasIndex(e => e.IsActive).HasDatabaseName("IX_BadWord_IsActive");
            entity.HasIndex(e => e.Level).HasDatabaseName("IX_BadWord_Level");
        });

        // ====== Policy System ======
        modelBuilder.Entity<Policy>(entity =>
        {
            entity.HasKey(e => e.PolicyId).HasName("Policy_pkey");

            entity.ToTable("Policy");

            entity.HasIndex(e => e.PolicyCode, "Policy_PolicyCode_key").IsUnique();

            entity.Property(e => e.PolicyCode)
                .HasMaxLength(50)
                .IsRequired();
            entity.Property(e => e.PolicyName)
                .HasMaxLength(200)
                .IsRequired();
            entity.Property(e => e.Description)
                .HasColumnType("text");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0);
            entity.Property(e => e.RequireConsent)
                .HasDefaultValue(true);
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
        });

        // PetAppointment configuration
        modelBuilder.Entity<PetAppointment>(entity =>
        {
            entity.HasKey(e => e.AppointmentId).HasName("PetAppointment_pkey");

            entity.ToTable("PetAppointment");

            entity.Property(e => e.AppointmentDateTime)
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.ActivityType).HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("pending");
            entity.Property(e => e.CounterOfferCount).HasDefaultValue(0);
            entity.Property(e => e.InviterCheckedIn).HasDefaultValue(false);
            entity.Property(e => e.InviteeCheckedIn).HasDefaultValue(false);
            entity.Property(e => e.InviterCheckInTime)
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.InviteeCheckInTime)
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            // Indexes
            entity.HasIndex(e => e.MatchId).HasDatabaseName("IX_PetAppointment_MatchId");
            entity.HasIndex(e => e.Status).HasDatabaseName("IX_PetAppointment_Status");
            entity.HasIndex(e => e.AppointmentDateTime).HasDatabaseName("IX_PetAppointment_DateTime");

            // Relationships
            entity.HasOne(d => d.Match).WithMany(p => p.PetAppointments)
                .HasForeignKey(d => d.MatchId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("PetAppointment_MatchId_fkey");

            entity.HasOne(d => d.InviterPet).WithMany(p => p.PetAppointmentsAsInviter)
                .HasForeignKey(d => d.InviterPetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("PetAppointment_InviterPetId_fkey");

            entity.HasOne(d => d.InviteePet).WithMany(p => p.PetAppointmentsAsInvitee)
                .HasForeignKey(d => d.InviteePetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("PetAppointment_InviteePetId_fkey");

            entity.HasOne(d => d.InviterUser).WithMany(p => p.PetAppointmentsAsInviter)
                .HasForeignKey(d => d.InviterUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("PetAppointment_InviterUserId_fkey");

            entity.HasOne(d => d.InviteeUser).WithMany(p => p.PetAppointmentsAsInvitee)
                .HasForeignKey(d => d.InviteeUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("PetAppointment_InviteeUserId_fkey");

            entity.HasOne(d => d.CurrentDecisionUser).WithMany(p => p.PetAppointmentsAsDecider)
                .HasForeignKey(d => d.CurrentDecisionUserId)
                .HasConstraintName("PetAppointment_CurrentDecisionUserId_fkey");

            entity.HasOne(d => d.CancelledByUser).WithMany(p => p.PetAppointmentsCancelled)
                .HasForeignKey(d => d.CancelledBy)
                .HasConstraintName("PetAppointment_CancelledBy_fkey");

            entity.HasOne(d => d.Location).WithMany(p => p.PetAppointments)
                .HasForeignKey(d => d.LocationId)
                .HasConstraintName("PetAppointment_LocationId_fkey");
        });

        // PetEvent configuration
        modelBuilder.Entity<PetEvent>(entity =>
        {
            entity.HasKey(e => e.EventId).HasName("PetEvent_pkey");

            entity.ToTable("PetEvent");

            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.CoverImageUrl).HasMaxLength(500);
            entity.Property(e => e.StartTime).HasColumnType("timestamp without time zone");
            entity.Property(e => e.SubmissionDeadline).HasColumnType("timestamp without time zone");
            entity.Property(e => e.EndTime).HasColumnType("timestamp without time zone");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("upcoming");
            entity.Property(e => e.PrizePoints).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            // Indexes
            entity.HasIndex(e => e.Status).HasDatabaseName("idx_event_status");
            entity.HasIndex(e => e.EndTime).HasDatabaseName("idx_event_endtime");

            // Relationships
            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.CreatedEvents)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("PetEvent_CreatedBy_fkey");
        });

        // EventSubmission configuration
        modelBuilder.Entity<EventSubmission>(entity =>
        {
            entity.HasKey(e => e.SubmissionId).HasName("EventSubmission_pkey");

            entity.ToTable("EventSubmission");

            entity.Property(e => e.MediaUrl).HasMaxLength(500);
            entity.Property(e => e.MediaType).HasMaxLength(20);
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);
            entity.Property(e => e.Caption).HasMaxLength(500);
            entity.Property(e => e.VoteCount).HasDefaultValue(0);
            entity.Property(e => e.IsWinner).HasDefaultValue(false);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            // Unique constraint: mỗi user chỉ 1 bài/event
            entity.HasIndex(e => new { e.EventId, e.UserId })
                .IsUnique()
                .HasDatabaseName("EventSubmission_EventId_UserId_key");

            // Indexes
            entity.HasIndex(e => e.EventId).HasDatabaseName("idx_submission_event");
            entity.HasIndex(e => new { e.EventId, e.VoteCount })
                .HasDatabaseName("idx_submission_votes");

            // Relationships
            entity.HasOne(d => d.Event).WithMany(p => p.Submissions)
                .HasForeignKey(d => d.EventId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("EventSubmission_EventId_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.EventSubmissions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("EventSubmission_UserId_fkey");

            entity.HasOne(d => d.Pet).WithMany(p => p.EventSubmissions)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("EventSubmission_PetId_fkey");
        });

        // EventVote configuration
        modelBuilder.Entity<EventVote>(entity =>
        {
            entity.HasKey(e => e.VoteId).HasName("EventVote_pkey");

            entity.ToTable("EventVote");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            // Unique constraint: mỗi user chỉ vote 1 lần/bài
            entity.HasIndex(e => new { e.SubmissionId, e.UserId })
                .IsUnique()
                .HasDatabaseName("EventVote_SubmissionId_UserId_key");

            // Relationships
            entity.HasOne(d => d.Submission).WithMany(p => p.Votes)
                .HasForeignKey(d => d.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("EventVote_SubmissionId_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.EventVotes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("EventVote_UserId_fkey");
        });

        // PolicyVersion configuration
        modelBuilder.Entity<PolicyVersion>(entity =>
        {
            entity.HasKey(e => e.PolicyVersionId).HasName("PolicyVersion_pkey");

            entity.ToTable("PolicyVersion");

            // Unique constraint: Mỗi Policy chỉ có 1 version number duy nhất
            entity.HasIndex(e => new { e.PolicyId, e.VersionNumber }, "PolicyVersion_PolicyId_VersionNumber_key").IsUnique();

            entity.Property(e => e.VersionNumber).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(300).IsRequired();
            entity.Property(e => e.Content).HasColumnType("text").IsRequired();
            entity.Property(e => e.ChangeLog).HasColumnType("text");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("DRAFT");
            entity.Property(e => e.PublishedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.DeactivatedAt).HasColumnType("timestamp without time zone");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.Policy)
                .WithMany(p => p.PolicyVersions)
                .HasForeignKey(d => d.PolicyId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("PolicyVersion_PolicyId_fkey");

            entity.HasOne(d => d.CreatedByUser)
                .WithMany(p => p.CreatedPolicyVersions)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("PolicyVersion_CreatedByUserId_fkey");

            // Index for quick lookup of active versions
            entity.HasIndex(e => new { e.PolicyId, e.Status })
                .HasDatabaseName("IX_PolicyVersion_PolicyId_Status");
        });

        modelBuilder.Entity<UserPolicyAccept>(entity =>
        {
            entity.HasKey(e => e.AcceptId).HasName("UserPolicyAccept_pkey");

            entity.ToTable("UserPolicyAccept");

            // Index for checking if user has accepted a specific version
            entity.HasIndex(e => new { e.UserId, e.PolicyVersionId, e.IsValid }, "IX_UserPolicyAccept_UserId_PolicyVersionId_IsValid");

            entity.Property(e => e.AcceptedAt)
                .HasColumnType("timestamp without time zone")
                .IsRequired();
            entity.Property(e => e.IsValid)
                .HasDefaultValue(true);
            entity.Property(e => e.InvalidatedAt)
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.HasOne(d => d.User)
                .WithMany(p => p.UserPolicyAccepts)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("UserPolicyAccept_UserId_fkey");

            entity.HasOne(d => d.PolicyVersion)
                .WithMany(p => p.UserPolicyAccepts)
                .HasForeignKey(d => d.PolicyVersionId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("UserPolicyAccept_PolicyVersionId_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
