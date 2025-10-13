using BE.Models;
using BE.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

public class GeneralConfiguration
{
    public PawnderDatabaseContext Context { get; }
    public TokenService TokenService { get; }
    public PasswordService PasswordService { get; }

    public GeneralConfiguration()
    {
        var options = new DbContextOptionsBuilder<PawnderDatabaseContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=pawnder_database;Username=postgres;Password=123456")
            .Options;

        Context = new PawnderDatabaseContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string>
            {
                {"Jwt:Issuer","MyApp"},
                {"Jwt:Audience","MyAppClients"},
                {"Jwt:Secret","DayLaChuoiSecretRatDaiVaBaoMat123456789"}
            })
            .Build();

        TokenService = new TokenService(config);
        PasswordService = new PasswordService();
    }
}
