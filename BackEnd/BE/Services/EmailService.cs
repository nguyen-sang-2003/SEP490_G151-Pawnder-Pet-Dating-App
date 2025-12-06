using Microsoft.Extensions.Options;
using Resend;

namespace BE.Services
{
    public class EmailService
    {
        private readonly ResendClient _resendClient;
        private readonly EmailSettings _settings;

        public EmailService(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
            
            // Initialize Resend client with API key
            if (string.IsNullOrWhiteSpace(_settings.ResendApiKey))
            {
                throw new InvalidOperationException("ResendApiKey is not configured in EmailSettings");
            }
            
            _resendClient = new ResendClient(_settings.ResendApiKey);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                // Resend SDK 0.2.1 uses Email class with different property names
                var email = new Email
                {
                    From = $"{_settings.SenderName} <{_settings.SenderEmail}>",
                    To = toEmail,
                    Subject = subject,
                    Html = body
                };

                var result = await _resendClient.SendEmailAsync(email);

                if (result == null || string.IsNullOrEmpty(result))
                {
                    throw new InvalidOperationException("Resend API returned empty response");
                }

                Console.WriteLine($"[EmailService] ✅ Email sent successfully to {toEmail} via Resend (ID: {result})");
            }
            catch (InvalidOperationException)
            {
                // Re-throw our custom exceptions
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] ❌ Failed to send email to {toEmail}: {ex.Message}");
                throw new InvalidOperationException($"Failed to send email via Resend: {ex.Message}", ex);
            }
        }
    }
    
    public class EmailSettings
    {
        /// <summary>
        /// Resend API Key - Get from https://resend.com/api-keys
        /// </summary>
        public string ResendApiKey { get; set; } = null!;
        
        /// <summary>
        /// Email address to send from
        /// For testing: onboarding@resend.dev (no verification needed)
        /// For production: Use verified domain (e.g., noreply@yourdomain.com)
        /// </summary>
        public string SenderEmail { get; set; } = null!;
        
        /// <summary>
        /// Display name for email sender
        /// </summary>
        public string SenderName { get; set; } = null!;
    }
}
