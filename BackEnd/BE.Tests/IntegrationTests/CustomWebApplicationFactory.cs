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

            db.SaveChanges();
        }
    }
}
