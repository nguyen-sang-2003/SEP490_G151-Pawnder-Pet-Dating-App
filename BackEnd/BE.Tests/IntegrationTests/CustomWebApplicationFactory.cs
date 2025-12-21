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
        }
    }
}
