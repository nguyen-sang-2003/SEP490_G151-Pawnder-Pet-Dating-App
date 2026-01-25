using BE.Models;
using BE.Services;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System;
using System.Linq;
using System.Net;
using System.Net.Sockets;
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
// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5297", "http://127.0.0.1:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR with authentication
    });
});

// Register OData + Controllers with Global Policy Accept Filter
builder.Services
    .AddControllers(options =>
    {
        // Thêm Global Policy Accept Filter để kiểm tra accept cho mọi request
        options.Filters.Add<BE.Filters.GlobalPolicyAcceptFilter>();
    })
    .AddOData(opt => opt.Select().Expand().Filter().OrderBy().Count().SetMaxTop(100));

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Pawnder API",
        Version = "v1",
        Description = "API for Pawnder Pet Dating App"
    });

    // Add JWT Authorization - Fixed configuration
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Enter your token (without 'Bearer' prefix).\n\nExample: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Connect PostgreSql
var connectionString = builder.Configuration.GetConnectionString("DbContext");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Connection string 'DbContext' is not configured.");
}

Console.WriteLine($"[DB] Using connection string: {connectionString.Replace(";Password=", ";Password=***")}");

// Configure DbContext với connection string
builder.Services.AddDbContext<PawnderDatabaseContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
        npgsqlOptions.CommandTimeout(30);
    }));

// Config JWT
builder.Services.AddScoped<TokenService>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var secret = jwtSection["Secret"] ?? throw new ArgumentNullException("Jwt:Secret is required");

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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        ClockSkew = TimeSpan.Zero
    };
});
builder.Services.AddAuthorization();
//Gemini AI Service
builder.Services.AddScoped<IGeminiAIService, GeminiAIService>();

// Register Email Service (Gmail API OAuth2)
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.Configure<GmailOAuth2Settings>(builder.Configuration.GetSection("GmailOAuth2Settings"));
builder.Services.AddSingleton<GmailOAuth2Service>();
builder.Services.AddScoped<BE.Services.Interfaces.IEmailService, EmailService>();

// setup save data 
builder.Services.AddMemoryCache();

// setup verifi email
builder.Services.Configure<KickboxSettings>(builder.Configuration.GetSection("KickboxSettings"));
builder.Services.AddHttpClient<IKickboxClient, KickboxClient>();

// SignalR for real-time communication with optimizations
builder.Services.AddSignalR(options =>
{
    // Tăng tốc độ response
    options.EnableDetailedErrors = false; // Disable detailed errors in production
    options.KeepAliveInterval = TimeSpan.FromSeconds(10); // Giảm từ 15s xuống 10s
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(20); // Giảm từ 30s xuống 20s
    options.HandshakeTimeout = TimeSpan.FromSeconds(10); // Giảm handshake timeout
    
    // Buffer size optimization
    options.MaximumReceiveMessageSize = 32 * 1024; // 32KB (đủ cho text messages)
    options.StreamBufferCapacity = 10; // Giảm buffer capacity
})
.AddJsonProtocol(options =>
{
    // Optimize JSON serialization
    options.PayloadSerializerOptions.PropertyNamingPolicy = null; // Faster serialization
    options.PayloadSerializerOptions.WriteIndented = false; // Compact JSON
});

// Register DistanceService
builder.Services.AddScoped<DistanceService>();

// Register PasswordService
builder.Services.AddScoped<PasswordService>();

// Register DailyLimitService
builder.Services.AddScoped<DailyLimitService>();

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
builder.Services.AddScoped<BE.Repositories.Interfaces.IAppointmentRepository, BE.Repositories.AppointmentRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IAppointmentLocationRepository, BE.Repositories.AppointmentLocationRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IEventRepository, BE.Repositories.EventRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.ISubmissionRepository, BE.Repositories.SubmissionRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IBadWordRepository, BE.Repositories.BadWordRepository>();
builder.Services.AddScoped<BE.Repositories.Interfaces.IPolicyRepository, BE.Repositories.PolicyRepository>();

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
builder.Services.AddScoped<BE.Services.IPetImageAnalysisService, BE.Services.PetImageAnalysisService>();
builder.Services.AddScoped<BE.Services.Interfaces.IAppointmentService, BE.Services.AppointmentService>();
builder.Services.AddScoped<BE.Services.Interfaces.IEventService, BE.Services.EventService>();
builder.Services.AddScoped<BE.Services.Interfaces.IBadWordService, BE.Services.BadWordService>();
builder.Services.AddScoped<BE.Services.Interfaces.IBadWordManagementService, BE.Services.BadWordManagementService>();
builder.Services.AddScoped<BE.Services.Interfaces.IPolicyService, BE.Services.PolicyService>();

// Register Global Policy Accept Filter
builder.Services.AddScoped<BE.Filters.GlobalPolicyAcceptFilter>();

// Register Background Services
builder.Services.AddHostedService<BE.Services.PaymentExpirationBackgroundService>();
builder.Services.AddHostedService<BE.Services.EventCompletionBackgroundService>();
builder.Services.AddHostedService<BE.Services.AppointmentExpirationBackgroundService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
// Global Exception Handler - Log errors to Azure
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        
        if (exception != null)
        {
            logger.LogError(exception, 
                "Unhandled exception occurred. Path: {Path}, Method: {Method}", 
                context.Request.Path, 
                context.Request.Method);
        }

        var response = new { 
            message = "An error occurred while processing your request.",
            error = exception?.Message,
            path = context.Request.Path
        };

        await context.Response.WriteAsJsonAsync(response);
    });
});

// Enable Swagger in all environments (Development and Production)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pawnder API V1");
    c.RoutePrefix = "swagger"; // Set Swagger UI at /swagger
});

app.UseCors("AllowAll");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub with compression for faster transmission
app.MapHub<ChatHub>("/chatHub", options =>
{
    // Enable WebSocket compression (giảm 50-70% bandwidth)
    options.Transports = Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets;
    
    // Application-level compression
    options.WebSockets.CloseTimeout = TimeSpan.FromSeconds(3);
});

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

// This is needed for WebApplicationFactory in integration tests
public partial class Program { }

