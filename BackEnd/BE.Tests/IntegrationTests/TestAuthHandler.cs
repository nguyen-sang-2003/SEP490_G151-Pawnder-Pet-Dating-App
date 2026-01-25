using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BE.Tests.IntegrationTests
{
    /// <summary>
    /// Custom Authentication Handler cho Integration Tests
    /// Tự động authenticate dựa trên header "X-Test-UserId" và "X-Test-Role"
    /// </summary>
    public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public TestAuthHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder)
            : base(options, logger, encoder)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            // Kiểm tra test headers
            if (!Request.Headers.TryGetValue("X-Test-UserId", out var userIdHeader))
            {
                return Task.FromResult(AuthenticateResult.Fail("Missing X-Test-UserId header"));
            }

            var userId = userIdHeader.FirstOrDefault() ?? "1";
            var role = Request.Headers.TryGetValue("X-Test-Role", out var roleHeader) 
                ? roleHeader.FirstOrDefault() ?? "User" 
                : "User";
            var email = Request.Headers.TryGetValue("X-Test-Email", out var emailHeader)
                ? emailHeader.FirstOrDefault() ?? "test@example.com"
                : "test@example.com";

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role),
                new Claim("sub", userId)
            };

            var identity = new ClaimsIdentity(claims, "TestScheme");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "TestScheme");

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
}
