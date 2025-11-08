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

//�dasda