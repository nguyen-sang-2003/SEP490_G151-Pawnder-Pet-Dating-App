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

    public virtual DbSet<Attribute> Attributes { get; set; }

    public virtual DbSet<Block> Blocks { get; set; }

    public virtual DbSet<Expertconfirmation> Expertconfirmations { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<Message> Messages { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Paymenthistory> Paymenthistories { get; set; }

    public virtual DbSet<Pet> Pets { get; set; }

    public virtual DbSet<Petcharacteristic> Petcharacteristics { get; set; }

    public virtual DbSet<Petphoto> Petphotos { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<Requestmatch> Requestmatches { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Userpreference> Userpreferences { get; set; }

    public virtual DbSet<Userstatus> Userstatuses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Attribute>(entity =>
        {
            entity.HasKey(e => e.Attributeid).HasName("attribute_pkey");

            entity.ToTable("attribute");

            entity.Property(e => e.Attributeid).HasColumnName("attributeid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Name)
                .HasMaxLength(150)
                .HasColumnName("name");
            entity.Property(e => e.Typevalue)
                .HasMaxLength(100)
                .HasColumnName("typevalue");
            entity.Property(e => e.Unit)
                .HasMaxLength(50)
                .HasColumnName("unit");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
        });

        modelBuilder.Entity<Block>(entity =>
        {
            entity.HasKey(e => e.Blockid).HasName("block_pkey");

            entity.ToTable("block");

            entity.Property(e => e.Blockid).HasColumnName("blockid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Fromuserid).HasColumnName("fromuserid");
            entity.Property(e => e.Touserid).HasColumnName("touserid");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");

            entity.HasOne(d => d.Fromuser).WithMany(p => p.BlockFromusers)
                .HasForeignKey(d => d.Fromuserid)
                .HasConstraintName("block_fromuserid_fkey");

            entity.HasOne(d => d.Touser).WithMany(p => p.BlockTousers)
                .HasForeignKey(d => d.Touserid)
                .HasConstraintName("block_touserid_fkey");
        });

        modelBuilder.Entity<Expertconfirmation>(entity =>
        {
            entity.HasKey(e => e.Confirmationid).HasName("expertconfirmation_pkey");

            entity.ToTable("expertconfirmation");

            entity.Property(e => e.Confirmationid).HasColumnName("confirmationid");
            entity.Property(e => e.Contentaccurate).HasColumnName("contentaccurate");
            entity.Property(e => e.Contentconfirmation).HasColumnName("contentconfirmation");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Expertid).HasColumnName("expertid");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasColumnName("status");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userrequestid).HasColumnName("userrequestid");

            entity.HasOne(d => d.Expert).WithMany(p => p.ExpertconfirmationExperts)
                .HasForeignKey(d => d.Expertid)
                .HasConstraintName("expertconfirmation_expertid_fkey");

            entity.HasOne(d => d.Userrequest).WithMany(p => p.ExpertconfirmationUserrequests)
                .HasForeignKey(d => d.Userrequestid)
                .HasConstraintName("expertconfirmation_userrequestid_fkey");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(e => e.Locationid).HasName("location_pkey");

            entity.ToTable("location");

            entity.Property(e => e.Locationid).HasColumnName("locationid");
            entity.Property(e => e.Commune)
                .HasMaxLength(100)
                .HasColumnName("commune");
            entity.Property(e => e.Country)
                .HasMaxLength(100)
                .HasColumnName("country");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Province)
                .HasMaxLength(100)
                .HasColumnName("province");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userid).HasColumnName("userid");

            entity.HasOne(d => d.User).WithMany(p => p.Locations)
                .HasForeignKey(d => d.Userid)
                .HasConstraintName("location_userid_fkey");
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.Messageid).HasName("message_pkey");

            entity.ToTable("message");

            entity.Property(e => e.Messageid).HasColumnName("messageid");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Matchid).HasColumnName("matchid");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userid).HasColumnName("userid");

            entity.HasOne(d => d.Match).WithMany(p => p.Messages)
                .HasForeignKey(d => d.Matchid)
                .HasConstraintName("message_matchid_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Messages)
                .HasForeignKey(d => d.Userid)
                .HasConstraintName("message_userid_fkey");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Notificationid).HasName("notification_pkey");

            entity.ToTable("notification");

            entity.Property(e => e.Notificationid).HasColumnName("notificationid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.Title)
                .HasMaxLength(150)
                .HasColumnName("title");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userid).HasColumnName("userid");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.Userid)
                .HasConstraintName("notification_userid_fkey");
        });

        modelBuilder.Entity<Paymenthistory>(entity =>
        {
            entity.HasKey(e => e.Historyid).HasName("paymenthistory_pkey");

            entity.ToTable("paymenthistory");

            entity.Property(e => e.Historyid).HasColumnName("historyid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Enddate).HasColumnName("enddate");
            entity.Property(e => e.Startdate).HasColumnName("startdate");
            entity.Property(e => e.Statusservice)
                .HasMaxLength(50)
                .HasColumnName("statusservice");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userid).HasColumnName("userid");

            entity.HasOne(d => d.User).WithMany(p => p.Paymenthistories)
                .HasForeignKey(d => d.Userid)
                .HasConstraintName("paymenthistory_userid_fkey");
        });

        modelBuilder.Entity<Pet>(entity =>
        {
            entity.HasKey(e => e.Petid).HasName("pet_pkey");

            entity.ToTable("pet");

            entity.Property(e => e.Petid).HasColumnName("petid");
            entity.Property(e => e.Age).HasColumnName("age");
            entity.Property(e => e.Breed)
                .HasMaxLength(100)
                .HasColumnName("breed");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Gender)
                .HasMaxLength(50)
                .HasColumnName("gender");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userid).HasColumnName("userid");

            entity.HasOne(d => d.User).WithMany(p => p.Pets)
                .HasForeignKey(d => d.Userid)
                .HasConstraintName("pet_userid_fkey");
        });

        modelBuilder.Entity<Petcharacteristic>(entity =>
        {
            entity.HasKey(e => e.Petcharacteristicid).HasName("petcharacteristic_pkey");

            entity.ToTable("petcharacteristic");

            entity.Property(e => e.Petcharacteristicid).HasColumnName("petcharacteristicid");
            entity.Property(e => e.Attributeid).HasColumnName("attributeid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Petid).HasColumnName("petid");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Value)
                .HasMaxLength(255)
                .HasColumnName("value");

            entity.HasOne(d => d.Attribute).WithMany(p => p.Petcharacteristics)
                .HasForeignKey(d => d.Attributeid)
                .HasConstraintName("petcharacteristic_attributeid_fkey");

            entity.HasOne(d => d.Pet).WithMany(p => p.Petcharacteristics)
                .HasForeignKey(d => d.Petid)
                .HasConstraintName("petcharacteristic_petid_fkey");
        });

        modelBuilder.Entity<Petphoto>(entity =>
        {
            entity.HasKey(e => e.Photoid).HasName("petphoto_pkey");

            entity.ToTable("petphoto");

            entity.Property(e => e.Photoid).HasColumnName("photoid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Imagepeturl).HasColumnName("imagepeturl");
            entity.Property(e => e.Petid).HasColumnName("petid");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");

            entity.HasOne(d => d.Pet).WithMany(p => p.Petphotos)
                .HasForeignKey(d => d.Petid)
                .HasConstraintName("petphoto_petid_fkey");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.Reportid).HasName("report_pkey");

            entity.ToTable("report");

            entity.Property(e => e.Reportid).HasColumnName("reportid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Fromuserid).HasColumnName("fromuserid");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.Resolution).HasColumnName("resolution");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasColumnName("status");
            entity.Property(e => e.Touserid).HasColumnName("touserid");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");

            entity.HasOne(d => d.Fromuser).WithMany(p => p.ReportFromusers)
                .HasForeignKey(d => d.Fromuserid)
                .HasConstraintName("report_fromuserid_fkey");

            entity.HasOne(d => d.Touser).WithMany(p => p.ReportTousers)
                .HasForeignKey(d => d.Touserid)
                .HasConstraintName("report_touserid_fkey");
        });

        modelBuilder.Entity<Requestmatch>(entity =>
        {
            entity.HasKey(e => e.Matchid).HasName("requestmatch_pkey");

            entity.ToTable("requestmatch");

            entity.Property(e => e.Matchid).HasColumnName("matchid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Fromuserid).HasColumnName("fromuserid");
            entity.Property(e => e.Statusrequest)
                .HasMaxLength(50)
                .HasColumnName("statusrequest");
            entity.Property(e => e.Touserid).HasColumnName("touserid");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");

            entity.HasOne(d => d.Fromuser).WithMany(p => p.RequestmatchFromusers)
                .HasForeignKey(d => d.Fromuserid)
                .HasConstraintName("requestmatch_fromuserid_fkey");

            entity.HasOne(d => d.Touser).WithMany(p => p.RequestmatchTousers)
                .HasForeignKey(d => d.Touserid)
                .HasConstraintName("requestmatch_touserid_fkey");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Roleid).HasName("role_pkey");

            entity.ToTable("role");

            entity.Property(e => e.Roleid).HasColumnName("roleid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Rolename)
                .HasMaxLength(100)
                .HasColumnName("rolename");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Userid).HasName("User_pkey");

            entity.ToTable("User");

            entity.HasIndex(e => e.Email, "User_email_key").IsUnique();

            entity.Property(e => e.Userid).HasColumnName("userid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Email)
                .HasMaxLength(150)
                .HasColumnName("email");
            entity.Property(e => e.Fullname)
                .HasMaxLength(150)
                .HasColumnName("fullname");
            entity.Property(e => e.Gender)
                .HasMaxLength(50)
                .HasColumnName("gender");
            entity.Property(e => e.Passwordhash).HasColumnName("passwordhash");
            entity.Property(e => e.Roleid).HasColumnName("roleid");
            entity.Property(e => e.Tokenjwt).HasColumnName("tokenjwt");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userstatusid).HasColumnName("userstatusid");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.Roleid)
                .HasConstraintName("User_roleid_fkey");

            entity.HasOne(d => d.Userstatus).WithMany(p => p.Users)
                .HasForeignKey(d => d.Userstatusid)
                .HasConstraintName("User_userstatusid_fkey");
        });

        modelBuilder.Entity<Userpreference>(entity =>
        {
            entity.HasKey(e => e.Userpreferenceid).HasName("userpreference_pkey");

            entity.ToTable("userpreference");

            entity.Property(e => e.Userpreferenceid).HasColumnName("userpreferenceid");
            entity.Property(e => e.Attributeid).HasColumnName("attributeid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userid).HasColumnName("userid");
            entity.Property(e => e.Value)
                .HasMaxLength(255)
                .HasColumnName("value");

            entity.HasOne(d => d.Attribute).WithMany(p => p.Userpreferences)
                .HasForeignKey(d => d.Attributeid)
                .HasConstraintName("userpreference_attributeid_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.Userpreferences)
                .HasForeignKey(d => d.Userid)
                .HasConstraintName("userpreference_userid_fkey");
        });

        modelBuilder.Entity<Userstatus>(entity =>
        {
            entity.HasKey(e => e.Userstatusid).HasName("userstatus_pkey");

            entity.ToTable("userstatus");

            entity.Property(e => e.Userstatusid).HasColumnName("userstatusid");
            entity.Property(e => e.Createdat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("createdat");
            entity.Property(e => e.Updatedat)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updatedat");
            entity.Property(e => e.Userstatusname)
                .HasMaxLength(100)
                .HasColumnName("userstatusname");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
