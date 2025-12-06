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
                var message = new EmailMessage
                {
                    From = $"{_settings.SenderName} <{_settings.SenderEmail}>",
                    To = new List<string> { toEmail },
                    Subject = subject,
                    HtmlBody = body
                };

                var result = await _resendClient.Email.SendAsync(message);

                // Check for errors in the result
                if (!result.IsSuccess || result.Error != null)
                {
                    var errorMessage = result.Error?.Message ?? "Unknown Resend API error";
                    throw new InvalidOperationException($"Resend API error: {errorMessage}");
                }

                Console.WriteLine($"[EmailService] ✅ Email sent successfully to {toEmail} via Resend (ID: {result.Data?.Id})");
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
