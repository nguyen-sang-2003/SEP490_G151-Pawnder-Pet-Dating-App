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
    public virtual DbSet<Block> Blocks { get; set; }
    public virtual DbSet<ChatAi> Chatais { get; set; }
    public virtual DbSet<ChatAiContent> Chataicontents { get; set; }
    public virtual DbSet<ChatUser> Chatusers { get; set; }
    public virtual DbSet<ChatUserContent> Chatusercontents { get; set; }
    public virtual DbSet<ExpertConfirmation> Expertconfirmations { get; set; }
    public virtual DbSet<Notification> Notifications { get; set; }
    public virtual DbSet<PaymentHistory> Paymenthistories { get; set; }
    public virtual DbSet<Pet> Pets { get; set; }
    public virtual DbSet<PetCharacteristic> Petcharacteristics { get; set; }
    public virtual DbSet<PetPhoto> Petphotos { get; set; }
    public virtual DbSet<Report> Reports { get; set; }
    public virtual DbSet<Role> Roles { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<UserPreference> Userpreferences { get; set; }
    public virtual DbSet<UserStatus> Userstatuses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // KHÔNG cần uuid-ossp nữa
        // modelBuilder.HasPostgresExtension("uuid-ossp");

        // ========== Address ==========
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("address_pkey");
            entity.ToTable("address");

            entity.Property(e => e.AddressId)
                .ValueGeneratedOnAdd()
                .HasColumnName("addressid");

            entity.Property(e => e.City).HasMaxLength(100).HasColumnName("city");
            entity.Property(e => e.District).HasMaxLength(100).HasColumnName("district");
            entity.Property(e => e.Ward).HasMaxLength(100).HasColumnName("ward");
            entity.Property(e => e.FullAddress).HasColumnName("fulladdress");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");
        });

        // ========== Attribute ==========
        modelBuilder.Entity<Attribute>(entity =>
        {
            entity.HasKey(e => e.Attributeid).HasName("attribute_pkey");
            entity.ToTable("attribute");

            entity.Property(e => e.Attributeid)
                .ValueGeneratedOnAdd()
                .HasColumnName("attributeid");

            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.TypeValue).HasMaxLength(50).HasColumnName("typevalue");
            entity.Property(e => e.Unit).HasMaxLength(20).HasColumnName("unit");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false).HasColumnName("isdeleted");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");
        });

        // ========== Block ==========
        modelBuilder.Entity<Block>(entity =>
        {
            entity.HasKey(e => new { e.FromUserId, e.ToUserId }).HasName("block_pkey");
            entity.ToTable("block");

            entity.Property(e => e.FromUserId).HasColumnName("fromuserid");
            entity.Property(e => e.ToUserId).HasColumnName("touserid");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.FromUser).WithMany(p => p.BlockFromUsers)
                .HasForeignKey(d => d.FromUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("block_fromuserid_fkey");

            entity.HasOne(d => d.ToUser).WithMany(p => p.BlockToUsers)
                .HasForeignKey(d => d.ToUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("block_touserid_fkey");
        });

        // ========== ChatAi ==========
        modelBuilder.Entity<ChatAi>(entity =>
        {
            entity.HasKey(e => e.ChatAiId).HasName("chatai_pkey");
            entity.ToTable("chatai");

            entity.Property(e => e.ChatAiId)
                .ValueGeneratedOnAdd()
                .HasColumnName("chataiid");

            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.Title).HasMaxLength(200).HasColumnName("title");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false).HasColumnName("isdeleted");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.User).WithMany(p => p.ChatAis)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("chatai_userid_fkey");
        });

        // ========== ChatAiContent ==========
        modelBuilder.Entity<ChatAiContent>(entity =>
        {
            entity.HasKey(e => e.ContentId).HasName("chataicontent_pkey");
            entity.ToTable("chataicontent");

            entity.Property(e => e.ContentId)
                .ValueGeneratedOnAdd()
                .HasColumnName("contentid");

            entity.Property(e => e.ChataiId).HasColumnName("chataiid");
            entity.Property(e => e.Question).HasColumnName("question");
            entity.Property(e => e.Answer).HasColumnName("answer");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.ChatAi).WithMany(p => p.ChatAiContents)
                .HasForeignKey(d => d.ChataiId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("chataicontent_chataiid_fkey");
        });

        // ========== ChatUser ==========
        modelBuilder.Entity<ChatUser>(entity =>
        {
            entity.HasKey(e => e.MatchId).HasName("chatuser_pkey");
            entity.ToTable("chatuser");

            entity.Property(e => e.MatchId)
                .ValueGeneratedOnAdd()
                .HasColumnName("matchid");

            entity.Property(e => e.FromUserId).HasColumnName("fromuserid");
            entity.Property(e => e.ToUserId).HasColumnName("touserid");
            entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("status");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false).HasColumnName("isdeleted");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.Fromuser).WithMany(p => p.ChatUserFromUsers)
                .HasForeignKey(d => d.FromUserId)
                .HasConstraintName("chatuser_fromuserid_fkey");

            entity.HasOne(d => d.Touser).WithMany(p => p.ChatUserToUsers)
                .HasForeignKey(d => d.ToUserId)
                .HasConstraintName("chatuser_touserid_fkey");
        });

        // ========== ChatUserContent ==========
        modelBuilder.Entity<ChatUserContent>(entity =>
        {
            entity.HasKey(e => e.ContentId).HasName("chatusercontent_pkey");
            entity.ToTable("chatusercontent");

            entity.Property(e => e.ContentId)
                .ValueGeneratedOnAdd()
                .HasColumnName("contentid");

            entity.Property(e => e.MatchId).HasColumnName("matchid");
            entity.Property(e => e.FromUserId).HasColumnName("fromuserid");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.FromUser).WithMany(p => p.ChatUserContents)
                .HasForeignKey(d => d.FromUserId)
                .HasConstraintName("chatusercontent_fromuserid_fkey");

            entity.HasOne(d => d.Match).WithMany(p => p.ChatUserContents)
                .HasForeignKey(d => d.MatchId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("chatusercontent_matchid_fkey");
        });

        // ========== ExpertConfirmation ==========
        modelBuilder.Entity<ExpertConfirmation>(entity =>
        {
            entity.HasKey(e => new { e.ExpertId, e.UserId, e.ChatAiId }).HasName("expertconfirmation_pkey");
            entity.ToTable("expertconfirmation");

            entity.Property(e => e.ExpertId).HasColumnName("expertid");
            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.ChatAiId).HasColumnName("chataiid");
            entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("status");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.ChatAi).WithMany(p => p.ExpertConfirmations)
                .HasForeignKey(d => d.ChatAiId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("expertconfirmation_chataiid_fkey");

            entity.HasOne(d => d.Expert).WithMany(p => p.ExpertConfirmationExperts)
                .HasForeignKey(d => d.ExpertId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("expertconfirmation_expertid_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.ExpertConfirmationUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("expertconfirmation_userid_fkey");
        });

        // ========== Notification ==========
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("notification_pkey");
            entity.ToTable("notification");

            entity.Property(e => e.NotificationId)
                .ValueGeneratedOnAdd()
                .HasColumnName("notificationid");

            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.Title).HasMaxLength(200).HasColumnName("title");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("notification_userid_fkey");
        });

        // ========== PaymentHistory ==========
        modelBuilder.Entity<PaymentHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("paymenthistory_pkey");
            entity.ToTable("paymenthistory");

            entity.Property(e => e.HistoryId)
                .ValueGeneratedOnAdd()
                .HasColumnName("historyid");

            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.StatusService).HasMaxLength(100).HasColumnName("statusservice");
            entity.Property(e => e.StartDate).HasColumnName("startdate");
            entity.Property(e => e.EndDate).HasColumnName("enddate");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.User).WithMany(p => p.PaymentHistories)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("paymenthistory_userid_fkey");
        });

        // ========== Pet ==========
        modelBuilder.Entity<Pet>(entity =>
        {
            entity.HasKey(e => e.PetId).HasName("pet_pkey");
            entity.ToTable("pet");

            entity.Property(e => e.PetId)
                .ValueGeneratedOnAdd()
                .HasColumnName("petid");

            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.Breed).HasMaxLength(100).HasColumnName("breed");
            entity.Property(e => e.Gender).HasMaxLength(10).HasColumnName("gender");
            entity.Property(e => e.Age).HasColumnName("age");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.IsDeadted).HasDefaultValue(false).HasColumnName("isdeadted");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false).HasColumnName("isdeleted");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.User).WithMany(p => p.Pets)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("pet_userid_fkey");
        });

        // ========== PetCharacteristic ==========
        modelBuilder.Entity<PetCharacteristic>(entity =>
        {
            entity.HasKey(e => new { e.PetId, e.AttributeId }).HasName("petcharacteristic_pkey");
            entity.ToTable("petcharacteristic");

            entity.Property(e => e.PetId).HasColumnName("petid");
            entity.Property(e => e.AttributeId).HasColumnName("attributeid");
            entity.Property(e => e.Value).HasColumnName("value");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.Attribute).WithMany(p => p.PetCharacteristics)
                .HasForeignKey(d => d.AttributeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("petcharacteristic_attributeid_fkey");

            entity.HasOne(d => d.Pet).WithMany(p => p.PetCharacteristics)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("petcharacteristic_petid_fkey");
        });

        // ========== PetPhoto ==========
        modelBuilder.Entity<PetPhoto>(entity =>
        {
            entity.HasKey(e => e.PhotoId).HasName("petphoto_pkey");
            entity.ToTable("petphoto");

            entity.Property(e => e.PhotoId)
                .ValueGeneratedOnAdd()
                .HasColumnName("photoid");

            entity.Property(e => e.PetId).HasColumnName("petid");
            entity.Property(e => e.ImageUrl).HasColumnName("imageurl");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.Pet).WithMany(p => p.PetPhotos)
                .HasForeignKey(d => d.PetId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("petphoto_petid_fkey");
        });

        // ========== Report ==========
        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.ReportId).HasName("report_pkey");
            entity.ToTable("report");

            entity.Property(e => e.ReportId)
                .ValueGeneratedOnAdd()
                .HasColumnName("reportid");

            entity.Property(e => e.UserReportId).HasColumnName("userreportid");
            entity.Property(e => e.ContentId).HasColumnName("contentid");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.Resolution).HasColumnName("resolution");
            entity.Property(e => e.Status).HasMaxLength(50).HasColumnName("status");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.Content).WithMany(p => p.Reports)
                .HasForeignKey(d => d.ContentId)
                .HasConstraintName("report_contentid_fkey");

            entity.HasOne(d => d.UserReport).WithMany(p => p.Reports)
                .HasForeignKey(d => d.UserReportId)
                .HasConstraintName("report_userreportid_fkey");
        });

        // ========== Role ==========
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("role_pkey");
            entity.ToTable("role");

            entity.Property(e => e.RoleId)
                .ValueGeneratedOnAdd()
                .HasColumnName("roleid");

            entity.Property(e => e.RoleName).HasMaxLength(50).HasColumnName("rolename");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");
        });

        // ========== User ==========
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("User_pkey");
            entity.ToTable("User");

            entity.HasIndex(e => e.Email, "User_email_key").IsUnique();

            entity.Property(e => e.UserId)
                .ValueGeneratedOnAdd()
                .HasColumnName("userid");

            entity.Property(e => e.RoleId).HasColumnName("roleid");
            entity.Property(e => e.UserStatusId).HasColumnName("userstatusid");
            entity.Property(e => e.AddressId).HasColumnName("addressid");

            entity.Property(e => e.Email).HasMaxLength(150).HasColumnName("email");
            entity.Property(e => e.FullName).HasMaxLength(100).HasColumnName("fullname");
            entity.Property(e => e.Gender).HasMaxLength(10).HasColumnName("gender");
            entity.Property(e => e.PasswordHash).HasColumnName("passwordhash");
            entity.Property(e => e.ProviderLogin).HasMaxLength(50).HasColumnName("providerlogin");
            entity.Property(e => e.TokenJWT).HasColumnName("tokenjwt");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false).HasColumnName("isdeleted");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.Address).WithMany(p => p.Users)
                .HasForeignKey(d => d.AddressId)
                .HasConstraintName("User_addressid_fkey");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .HasConstraintName("User_roleid_fkey");

            entity.HasOne(d => d.Userstatus).WithMany(p => p.Users)
                .HasForeignKey(d => d.UserStatusId)
                .HasConstraintName("User_userstatusid_fkey");
        });

        // ========== UserPreference ==========
        modelBuilder.Entity<UserPreference>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.AttributeId }).HasName("userpreference_pkey");
            entity.ToTable("userpreference");

            entity.Property(e => e.UserId).HasColumnName("userid");
            entity.Property(e => e.AttributeId).HasColumnName("attributeid");
            entity.Property(e => e.Value).HasColumnName("value");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");

            entity.HasOne(d => d.Attribute).WithMany(p => p.UserPreferences)
                .HasForeignKey(d => d.AttributeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("userpreference_attributeid_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.UserPreferences)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("userpreference_userid_fkey");
        });

        // ========== UserStatus ==========
        modelBuilder.Entity<UserStatus>(entity =>
        {
            entity.HasKey(e => e.UserStatusId).HasName("userstatus_pkey");
            entity.ToTable("userstatus");

            entity.Property(e => e.UserStatusId)
                .ValueGeneratedOnAdd()
                .HasColumnName("userstatusid");

            entity.Property(e => e.UserStatusName).HasMaxLength(50).HasColumnName("userstatusname");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("createdat");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnType("timestamp without time zone").HasColumnName("updatedat");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
