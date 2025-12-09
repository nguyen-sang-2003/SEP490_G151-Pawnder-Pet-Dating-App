using BE.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace BE.Services
{
    public class EmailService : IEmailService
    {
        private readonly GmailOAuth2Service _gmailService;
        private readonly EmailSettings _settings;

        public EmailService(
            GmailOAuth2Service gmailService,
            IOptions<EmailSettings> settings)
        {
            _gmailService = gmailService;
            _settings = settings.Value;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            await _gmailService.SendEmailAsync(
                toEmail, 
                subject, 
                body, 
                _settings.SenderEmail, 
                _settings.SenderName);
        }
    }

    public class EmailSettings
    {
        public string SenderName { get; set; } = null!;
        public string SenderEmail { get; set; } = null!;
    }
}
