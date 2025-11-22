using BE.Models;
using BE.Services;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//Cloundinary config
builder.Services.Configure<CloudinarySettings>(
    builder.Configuration.GetSection("Cloudinary"));

builder.Services.AddSingleton<Cloudinary>(sp =>
{
    var s = sp.GetRequiredService<IOptions<CloudinarySettings>>().Value;
    var account = new Account(s.CloudName, s.ApiKey, s.ApiSecret);
    var cloud = new Cloudinary(account);
    cloud.Api.Secure = true;
    return cloud;
});

// storage abstraction
builder.Services.AddScoped<IPhotoStorage, CloudinaryPhotoStorage>();
// Add services to the container.
//Address service
builder.Services.AddHttpClient();
// Register OData + Controllers
builder.Services
    .AddControllers()
    .AddOData(opt => opt.Select().Expand().Filter().OrderBy().Count().SetMaxTop(100));

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Connect PostgreSql
builder.Services.AddDbContext<PawnderDatabaseContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DbContext")));

// Config JWT
builder.Services.AddScoped<TokenService>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var secret = jwtSection["Secret"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSection["Issuer"],
        ValidAudience = jwtSection["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
    };
    
    // Allow CORS preflight requests to pass through without authentication
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Skip authentication for OPTIONS requests (CORS preflight)
            if (context.Request.Method == "OPTIONS")
            {
                context.Token = null;
            }
            return System.Threading.Tasks.Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization();
//Gemini AI Service
builder.Services.AddScoped<IGeminiAIService, GeminiAIService>();

// Register Email Service 
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddTransient<EmailService>();

// setup save data 
builder.Services.AddMemoryCache();

// setup verifi email
builder.Services.Configure<KickboxSettings>(builder.Configuration.GetSection("KickboxSettings"));
builder.Services.AddHttpClient<IKickboxClient, KickboxClient>();

// Add CORS - Must be configured before building the app
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromSeconds(3600)); // Cache preflight for 1 hour
    });
    
    // Also add named policy for explicit use
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromSeconds(3600));
    });
});
// realtime
builder.Services.AddSignalR();

// Register DistanceService
builder.Services.AddScoped<DistanceService>();

// Register PasswordService
builder.Services.AddScoped<PasswordService>();

// Register DailyLimitService
builder.Services.AddScoped<DailyLimitService>();

// Register PetImageAnalysisService with HttpClient
builder.Services.AddHttpClient<IPetImageAnalysisService, PetImageAnalysisService>();

// ============================================
// Register Repositories (Repository Pattern)
// ============================================
builder.Services.AddScoped<BE.Repositories.Interfaces.IPetRepository, BE.Repositories.PetRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IUserRepository, BE.Repositories.UserRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IAddressRepository, BE.Repositories.AddressRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IPetPhotoRepository, BE.Repositories.PetPhotoRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IBlockRepository, BE.Repositories.BlockRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IAttributeRepository, BE.Repositories.AttributeRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.INotificationRepository, BE.Repositories.NotificationRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IPetCharacteristicRepository, BE.Repositories.PetCharacteristicRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IAttributeOptionRepository, BE.Repositories.AttributeOptionRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IExpertConfirmationRepository, BE.Repositories.ExpertConfirmationRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IUserPreferenceRepository, BE.Repositories.UserPreferenceRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IPaymentHistoryRepository, BE.Repositories.PaymentHistoryRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IReportRepository, BE.Repositories.ReportRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IChatUserRepository, BE.Repositories.ChatUserRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IChatUserContentRepository, BE.Repositories.ChatUserContentRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IChatExpertRepository, BE.Repositories.ChatExpertRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IChatExpertContentRepository, BE.Repositories.ChatExpertContentRepository>();

// ============================================
// Register Services (Service Layer)
// ============================================
builder.Services.AddScoped<BE.Services.Interfaces.IPetService, BE.Services.PetService>();
builder.Services.AddScoped<BE.Services.Interfaces.IUserService, BE.Services.UserService>();
builder.Services.AddScoped<BE.Services.Interfaces.IAddressService, BE.Services.AddressService>();
builder.Services.AddScoped<BE.Services.Interfaces.IPetPhotoService, BE.Services.PetPhotoService>();
builder.Services.AddScoped<BE.Services.Interfaces.IBlockService, BE.Services.BlockService>();
builder.Services.AddScoped<BE.Services.Interfaces.IAttributeService, BE.Services.AttributeService>();
builder.Services.AddScoped<BE.Services.Interfaces.INotificationService, BE.Services.NotificationService>();
builder.Services.AddScoped<BE.Services.Interfaces.IPetCharacteristicService, BE.Services.PetCharacteristicService>();
builder.Services.AddScoped<BE.Services.Interfaces.IAttributeOptionService, BE.Services.AttributeOptionService>();
builder.Services.AddScoped<BE.Services.Interfaces.IExpertConfirmationService, BE.Services.ExpertConfirmationService>();
builder.Services.AddScoped<BE.Services.Interfaces.IOtpService, BE.Services.OtpService>();
builder.Services.AddScoped<BE.Services.Interfaces.IUserPreferenceService, BE.Services.UserPreferenceService>();
builder.Services.AddScoped<BE.Services.Interfaces.IPaymentHistoryService, BE.Services.PaymentHistoryService>();
builder.Services.AddScoped<BE.Services.Interfaces.IReportService, BE.Services.ReportService>();
builder.Services.AddScoped<BE.Services.Interfaces.IDailyLimitService, BE.Services.DailyLimitService>();
builder.Services.AddScoped<BE.Services.Interfaces.IPetRecommendationService, BE.Services.PetRecommendationService>();
builder.Services.AddScoped<BE.Services.Interfaces.IChatAIService, BE.Services.ChatAIService>();
builder.Services.AddScoped<BE.Services.Interfaces.IAdminService, BE.Services.AdminService>();
builder.Services.AddScoped<BE.Services.Interfaces.IAuthService, BE.Services.AuthService>();
builder.Services.AddScoped<BE.Services.Interfaces.IChatUserService, BE.Services.ChatUserService>();
builder.Services.AddScoped<BE.Services.Interfaces.IChatUserContentService, BE.Services.ChatUserContentService>();
builder.Services.AddScoped<BE.Services.Interfaces.IChatExpertService, BE.Services.ChatExpertService>();
builder.Services.AddScoped<BE.Services.Interfaces.IChatExpertContentService, BE.Services.ChatExpertContentService>();
builder.Services.AddScoped<BE.Services.Interfaces.IMatchService, BE.Services.MatchService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
// IMPORTANT: Middleware order matters!

// 1. CORS must be FIRST, before any other middleware
app.UseCors();

// 2. Routing (required for endpoint routing)
app.UseRouting();

// 3. Swagger (in development)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // Disable HTTPS redirection in development to allow HTTP requests
}

// 4. Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

// 5. Map controllers
app.MapControllers();

app.MapHub<ChatHub>("/chatHub");

app.Run();
public class CloudinarySettings
{
    public string CloudName { get; set; } = null!;
    public string ApiKey { get; set; } = null!;
    public string ApiSecret { get; set; } = null!;
    public string Folder { get; set; } = "pawnder/pets";
}

public interface IPhotoStorage
{
    Task<(string Url, string PublicId)> UploadAsync(int petId, IFormFile file, CancellationToken ct = default);
    Task DeleteAsync(string publicId, CancellationToken ct = default);
}
