using BE.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace BE.Tests.IntegrationTests
{
    /// <summary>
    /// Custom WebApplicationFactory cho Integration Tests
    /// Sử dụng In-Memory Database thay vì PostgreSQL thật
    /// </summary>
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbName = "IntegrationTestDb_" + Guid.NewGuid().ToString();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureTestServices(services =>
            {
                // Remove tất cả DbContext related services
                var descriptorsToRemove = services.Where(d =>
                    d.ServiceType == typeof(DbContextOptions<PawnderDatabaseContext>) ||
                    d.ServiceType == typeof(PawnderDatabaseContext) ||
                    d.ServiceType.FullName?.Contains("EntityFrameworkCore") == true ||
                    d.ServiceType.FullName?.Contains("Npgsql") == true).ToList();

                foreach (var descriptor in descriptorsToRemove)
                {
                    services.Remove(descriptor);
                }

                // Thêm In-Memory Database cho testing
                services.AddDbContext<PawnderDatabaseContext>((sp, options) =>
                {
                    options.UseInMemoryDatabase(_dbName);
                }, ServiceLifetime.Scoped);

                // Thay đổi Authentication scheme cho testing
                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = "TestScheme";
                    options.DefaultChallengeScheme = "TestScheme";
                }).AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("TestScheme", options => { });
            });
        }

        /// <summary>
        /// Override CreateHost để seed data sau khi host được tạo
        /// </summary>
        protected override IHost CreateHost(IHostBuilder builder)
        {
            var host = base.CreateHost(builder);

            // Seed data sau khi host được tạo
            using (var scope = host.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<PawnderDatabaseContext>();
                db.Database.EnsureCreated();
                SeedTestData(db);
            }

            return host;
        }

        private static void SeedTestData(PawnderDatabaseContext db)
        {
            // Tạo Role cho test
            if (!db.Roles.Any())
            {
                db.Roles.AddRange(
                    new Role { RoleId = 1, RoleName = "Admin" },
                    new Role { RoleId = 2, RoleName = "Expert" },
                    new Role { RoleId = 3, RoleName = "User" }
                );
                db.SaveChanges();
            }

            // Tạo test user không có address (cho UC-1.1-TC-1)
            if (!db.Users.Any(u => u.UserId == 1))
            {
                db.Users.Add(new User
                {
                    UserId = 1,
                    FullName = "Test User",
                    Email = "test@example.com",
                    PasswordHash = "hashed_password_123",
                    RoleId = 3,
                    AddressId = null,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Tạo test user có address (cho UC-1.1-TC-3)
            if (!db.Users.Any(u => u.UserId == 2))
            {
                var existingAddress = new Address
                {
                    AddressId = 1,
                    Latitude = 10.762622m,
                    Longitude = 106.660172m,
                    FullAddress = "123 Đường ABC, Quận 1, TP.HCM",
                    City = "Thành phố Hồ Chí Minh",
                    District = "Quận 1",
                    Ward = "Phường XYZ",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Addresses.Add(existingAddress);

                db.Users.Add(new User
                {
                    UserId = 2,
                    FullName = "User With Address",
                    Email = "user2@example.com",
                    PasswordHash = "hashed_password_456",
                    RoleId = 3,
                    AddressId = 1,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Tạo user cho authentication tests (UC-4.1)
            // user@example.com với password "Test@123" (BCrypt hash)
            if (!db.Users.Any(u => u.Email == "user@example.com"))
            {
                db.Users.Add(new User
                {
                    UserId = 100,
                    FullName = "Test User",
                    Email = "user@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                    RoleId = 3, // User
                    AddressId = null,
                    IsDeleted = false,
                    IsProfileComplete = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // admin@example.com với password "Admin@123" (BCrypt hash)
            if (!db.Users.Any(u => u.Email == "admin@example.com"))
            {
                db.Users.Add(new User
                {
                    UserId = 101,
                    FullName = "Admin User",
                    Email = "admin@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    RoleId = 1, // Admin
                    AddressId = null,
                    IsDeleted = false,
                    IsProfileComplete = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // banned@example.com - user bị ban
            if (!db.Users.Any(u => u.Email == "banned@example.com"))
            {
                db.Users.Add(new User
                {
                    UserId = 102,
                    FullName = "Banned User",
                    Email = "banned@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                    RoleId = 3, // User
                    AddressId = null,
                    IsDeleted = false,
                    IsProfileComplete = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            db.SaveChanges();

            // Tạo ban history cho banned user
            if (!db.UserBanHistories.Any(b => b.UserId == 102))
            {
                db.UserBanHistories.Add(new UserBanHistory
                {
                    UserId = 102,
                    BanStart = new DateTime(2025, 1, 1, 0, 0, 0),
                    BanEnd = new DateTime(2025, 12, 31, 23, 59, 59),
                    BanReason = "Vi phạm quy định",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                db.SaveChanges();
            }

            // Tạo Attributes cho UserPreference tests
            if (!db.Attributes.Any())
            {
                db.Attributes.AddRange(
                    new BE.Models.Attribute
                    {
                        AttributeId = 1,
                        Name = "Giống loài",
                        TypeValue = "string",
                        Unit = null,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow
                    },
                    new BE.Models.Attribute
                    {
                        AttributeId = 2,
                        Name = "Cân nặng",
                        TypeValue = "float",
                        Unit = "kg",
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow
                    },
                    new BE.Models.Attribute
                    {
                        AttributeId = 3,
                        Name = "Màu lông",
                        TypeValue = "string",
                        Unit = null,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow
                    }
                );
                db.SaveChanges();
            }

            // Tạo AttributeOptions cho string type attributes
            if (!db.AttributeOptions.Any())
            {
                db.AttributeOptions.AddRange(
                    // Options cho Giống loài (AttributeId = 1)
                    new AttributeOption { OptionId = 5, AttributeId = 1, Name = "Chó Phốc Sóc", IsDeleted = false, CreatedAt = DateTime.UtcNow },
                    new AttributeOption { OptionId = 6, AttributeId = 1, Name = "Chó Husky", IsDeleted = false, CreatedAt = DateTime.UtcNow },
                    new AttributeOption { OptionId = 7, AttributeId = 1, Name = "Chó Corgi", IsDeleted = false, CreatedAt = DateTime.UtcNow },
                    // Options cho Màu lông (AttributeId = 3)
                    new AttributeOption { OptionId = 10, AttributeId = 3, Name = "Trắng", IsDeleted = false, CreatedAt = DateTime.UtcNow },
                    new AttributeOption { OptionId = 11, AttributeId = 3, Name = "Đen", IsDeleted = false, CreatedAt = DateTime.UtcNow }
                );
                db.SaveChanges();
            }

            // Tạo UserPreferences cho test user 1 (có preferences)
            if (!db.UserPreferences.Any(p => p.UserId == 1))
            {
                db.UserPreferences.Add(new UserPreference
                {
                    UserId = 1,
                    AttributeId = 1,
                    OptionId = 5, // Chó Phốc Sóc
                    MinValue = null,
                    MaxValue = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                db.SaveChanges();
            }

            // Tạo Pets cho SetActivePet integration tests
            if (!db.Pets.Any())
            {
                db.Pets.AddRange(
                    // Pet 1: Active pet của user 1
                    new Pet
                    {
                        PetId = 1,
                        UserId = 1,
                        Name = "Buddy",
                        Breed = "Golden Retriever",
                        Gender = "Male",
                        Age = 3,
                        IsActive = true,
                        IsDeleted = false,
                        Description = "Friendly dog",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Pet 2: Inactive pet của user 1
                    new Pet
                    {
                        PetId = 2,
                        UserId = 1,
                        Name = "Max",
                        Breed = "Husky",
                        Gender = "Male",
                        Age = 2,
                        IsActive = false,
                        IsDeleted = false,
                        Description = "Playful husky",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Pet 3: Pet của user 2
                    new Pet
                    {
                        PetId = 3,
                        UserId = 2,
                        Name = "Luna",
                        Breed = "Corgi",
                        Gender = "Female",
                        Age = 1,
                        IsActive = true,
                        IsDeleted = false,
                        Description = "Cute corgi",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Pet 4: Inactive pet của user 2
                    new Pet
                    {
                        PetId = 4,
                        UserId = 2,
                        Name = "Charlie",
                        Breed = "Poodle",
                        Gender = "Male",
                        Age = 4,
                        IsActive = false,
                        IsDeleted = false,
                        Description = "Smart poodle",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Pet 5: Deleted pet (cho test UC-P-5.1-TC-5)
                    new Pet
                    {
                        PetId = 5,
                        UserId = 1,
                        Name = "Rocky",
                        Breed = "Bulldog",
                        Gender = "Male",
                        Age = 5,
                        IsActive = false,
                        IsDeleted = true,  // Đã bị xóa
                        Description = "Deleted pet",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                );
                db.SaveChanges();
            }

            // Tạo PetCharacteristics cho integration tests
            if (!db.PetCharacteristics.Any())
            {
                db.PetCharacteristics.AddRange(
                    // Pet 1 có characteristic với AttributeId = 1 (string type - Giống loài)
                    new PetCharacteristic
                    {
                        PetId = 1,
                        AttributeId = 1,
                        OptionId = 5, // Chó Phốc Sóc
                        Value = null,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Pet 3 có multiple characteristics
                    new PetCharacteristic
                    {
                        PetId = 3,
                        AttributeId = 1,
                        OptionId = 7, // Chó Corgi
                        Value = null,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new PetCharacteristic
                    {
                        PetId = 3,
                        AttributeId = 2, // Cân nặng (float type)
                        OptionId = null,
                        Value = 12,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new PetCharacteristic
                    {
                        PetId = 3,
                        AttributeId = 3, // Màu lông (string type)
                        OptionId = 10, // Trắng
                        Value = null,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                );
                db.SaveChanges();
            }

            // Tạo PetPhotos cho integration tests
            if (!db.PetPhotos.Any())
            {
                db.PetPhotos.AddRange(
                    // Pet 1 có 2 photos
                    new PetPhoto
                    {
                        PhotoId = 1,
                        PetId = 1,
                        ImageUrl = "https://example.com/photo1.jpg",
                        PublicId = "photo1",
                        IsPrimary = true,
                        SortOrder = 0,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new PetPhoto
                    {
                        PhotoId = 2,
                        PetId = 1,
                        ImageUrl = "https://example.com/photo2.jpg",
                        PublicId = "photo2",
                        IsPrimary = false,
                        SortOrder = 1,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Pet 3 có 3 photos (1 đã bị xóa)
                    new PetPhoto
                    {
                        PhotoId = 3,
                        PetId = 3,
                        ImageUrl = "https://example.com/photo3.jpg",
                        PublicId = "photo3",
                        IsPrimary = true,
                        SortOrder = 0,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new PetPhoto
                    {
                        PhotoId = 4,
                        PetId = 3,
                        ImageUrl = "https://example.com/photo4.jpg",
                        PublicId = "photo4",
                        IsPrimary = false,
                        SortOrder = 1,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new PetPhoto
                    {
                        PhotoId = 5,
                        PetId = 3,
                        ImageUrl = "https://example.com/photo5_deleted.jpg",
                        PublicId = "photo5",
                        IsPrimary = false,
                        SortOrder = 2,
                        IsDeleted = true, // Đã bị xóa
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                );
                db.SaveChanges();
            }

            // Seed data for Report integration tests
            // Tạo thêm users cho report tests
            if (!db.Users.Any(u => u.UserId == 10))
            {
                db.Users.Add(new User
                {
                    UserId = 10,
                    FullName = "Reporter User",
                    Email = "reporter@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                    RoleId = 3,
                    AddressId = null,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (!db.Users.Any(u => u.UserId == 11))
            {
                db.Users.Add(new User
                {
                    UserId = 11,
                    FullName = "Reported User",
                    Email = "reported@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                    RoleId = 3,
                    AddressId = null,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (!db.Users.Any(u => u.UserId == 12))
            {
                db.Users.Add(new User
                {
                    UserId = 12,
                    FullName = "User Without Reports",
                    Email = "noreports@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
                    RoleId = 3,
                    AddressId = null,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            db.SaveChanges();

            // Tạo pets cho report tests
            if (!db.Pets.Any(p => p.PetId == 10))
            {
                db.Pets.Add(new Pet
                {
                    PetId = 10,
                    UserId = 10,
                    Name = "Reporter Pet",
                    Breed = "Labrador",
                    Gender = "Male",
                    Age = 2,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            if (!db.Pets.Any(p => p.PetId == 11))
            {
                db.Pets.Add(new Pet
                {
                    PetId = 11,
                    UserId = 11,
                    Name = "Reported Pet",
                    Breed = "Beagle",
                    Gender = "Female",
                    Age = 3,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            db.SaveChanges();

            // Tạo ChatUser (Match) cho report tests
            if (!db.ChatUsers.Any(c => c.MatchId == 10))
            {
                db.ChatUsers.Add(new ChatUser
                {
                    MatchId = 10,
                    FromPetId = 10,
                    ToPetId = 11,
                    FromUserId = 10,
                    ToUserId = 11,
                    Status = "Active",
                    IsDeleted = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            db.SaveChanges();

            // Tạo ChatUserContent cho report tests
            if (!db.ChatUserContents.Any(c => c.ContentId == 10))
            {
                db.ChatUserContents.Add(new ChatUserContent
                {
                    ContentId = 10,
                    MatchId = 10, // Reference to ChatUser match
                    FromPetId = 11, // From reported user's pet
                    FromUserId = 11, // From reported user
                    Message = "Inappropriate message",
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (!db.ChatUserContents.Any(c => c.ContentId == 11))
            {
                db.ChatUserContents.Add(new ChatUserContent
                {
                    ContentId = 11,
                    MatchId = 10, // Reference to ChatUser match
                    FromPetId = 11,
                    FromUserId = 11,
                    Message = "Another message",
                    CreatedAt = DateTime.UtcNow
                });
            }

            db.SaveChanges();

            // Tạo Reports cho tests
            if (!db.Reports.Any(r => r.ReportId == 1))
            {
                db.Reports.Add(new Report
                {
                    ReportId = 1,
                    UserReportId = 10,
                    ContentId = 10,
                    Reason = "Nội dung không phù hợp",
                    Status = "Pending",
                    Resolution = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            if (!db.Reports.Any(r => r.ReportId == 2))
            {
                db.Reports.Add(new Report
                {
                    ReportId = 2,
                    UserReportId = 10,
                    ContentId = 11,
                    Reason = "Spam",
                    Status = "Pending",
                    Resolution = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            db.SaveChanges();

            // Seed data for Appointment integration tests
            // Tạo PetAppointmentLocation cho tests
            if (!db.PetAppointmentLocations.Any())
            {
                db.PetAppointmentLocations.AddRange(
                    new PetAppointmentLocation
                    {
                        LocationId = 1,
                        Name = "Pet Café Saigon",
                        Address = "123 Nguyễn Huệ, Quận 1, TP.HCM",
                        Latitude = 10.7731m,
                        Longitude = 106.7030m,
                        City = "Thành phố Hồ Chí Minh",
                        District = "Quận 1",
                        IsPetFriendly = true,
                        PlaceType = "pet_cafe",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new PetAppointmentLocation
                    {
                        LocationId = 2,
                        Name = "Công viên Tao Đàn",
                        Address = "Phường Bến Thành, Quận 1, TP.HCM",
                        Latitude = 10.7750m,
                        Longitude = 106.6922m,
                        City = "Thành phố Hồ Chí Minh",
                        District = "Quận 1",
                        IsPetFriendly = true,
                        PlaceType = "park",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                );
                db.SaveChanges();
            }

            // Tạo PetAppointments cho tests
            if (!db.PetAppointments.Any())
            {
                db.PetAppointments.AddRange(
                    // Appointment 1: Pending - User 2 cần respond
                    new PetAppointment
                    {
                        AppointmentId = 1,
                        MatchId = 10,
                        InviterPetId = 10,
                        InviteePetId = 11,
                        InviterUserId = 10,
                        InviteeUserId = 11,
                        AppointmentDateTime = DateTime.UtcNow.AddDays(7),
                        LocationId = 1,
                        ActivityType = "cafe",
                        Status = "pending",
                        CurrentDecisionUserId = 11,
                        CounterOfferCount = 0,
                        InviterCheckedIn = false,
                        InviteeCheckedIn = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Appointment 2: Confirmed - Sẵn sàng check-in
                    new PetAppointment
                    {
                        AppointmentId = 2,
                        MatchId = 10,
                        InviterPetId = 10,
                        InviteePetId = 11,
                        InviterUserId = 10,
                        InviteeUserId = 11,
                        AppointmentDateTime = DateTime.UtcNow.AddHours(1),
                        LocationId = 1,
                        ActivityType = "walk",
                        Status = "confirmed",
                        CurrentDecisionUserId = null,
                        CounterOfferCount = 0,
                        InviterCheckedIn = false,
                        InviteeCheckedIn = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Appointment 3: On-going - Đã check-in, sẵn sàng complete
                    new PetAppointment
                    {
                        AppointmentId = 3,
                        MatchId = 10,
                        InviterPetId = 10,
                        InviteePetId = 11,
                        InviterUserId = 10,
                        InviteeUserId = 11,
                        AppointmentDateTime = DateTime.UtcNow.AddHours(-1),
                        LocationId = 2,
                        ActivityType = "playdate",
                        Status = "on_going",
                        CurrentDecisionUserId = null,
                        CounterOfferCount = 0,
                        InviterCheckedIn = true,
                        InviteeCheckedIn = true,
                        InviterCheckInTime = DateTime.UtcNow.AddMinutes(-30),
                        InviteeCheckInTime = DateTime.UtcNow.AddMinutes(-25),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Appointment 4: Cancelled
                    new PetAppointment
                    {
                        AppointmentId = 4,
                        MatchId = 10,
                        InviterPetId = 10,
                        InviteePetId = 11,
                        InviterUserId = 10,
                        InviteeUserId = 11,
                        AppointmentDateTime = DateTime.UtcNow.AddDays(-1),
                        LocationId = 1,
                        ActivityType = "cafe",
                        Status = "cancelled",
                        CurrentDecisionUserId = null,
                        CounterOfferCount = 0,
                        CancelledBy = 10,
                        CancelReason = "Có việc bận đột xuất",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    // Appointment 5: Pending với counter offer count = 2
                    new PetAppointment
                    {
                        AppointmentId = 5,
                        MatchId = 10,
                        InviterPetId = 10,
                        InviteePetId = 11,
                        InviterUserId = 10,
                        InviteeUserId = 11,
                        AppointmentDateTime = DateTime.UtcNow.AddDays(3),
                        LocationId = 2,
                        ActivityType = "walk",
                        Status = "pending",
                        CurrentDecisionUserId = 10,
                        CounterOfferCount = 2,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                );
                db.SaveChanges();
            }
        }
    }
}
