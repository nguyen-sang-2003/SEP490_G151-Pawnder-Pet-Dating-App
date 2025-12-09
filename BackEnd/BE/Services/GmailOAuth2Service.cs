using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Gmail.v1;
using Google.Apis.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;

namespace BE.Services
{
    public class GmailOAuth2Service
    {
        private readonly GmailOAuth2Settings _settings;
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<GmailOAuth2Service>? _logger;
        private GmailService? _gmailService;

        public GmailOAuth2Service(
            IOptions<GmailOAuth2Settings> settings,
            IOptions<EmailSettings> emailSettings,
            ILogger<GmailOAuth2Service>? logger = null)
        {
            _settings = settings.Value;
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        private async Task<GmailService> GetGmailServiceAsync()
        {
            if (_gmailService != null)
            {
                // Service đã được khởi tạo, Google API sẽ tự xử lý refresh token khi cần
                return _gmailService;
            }

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = _settings.ClientId,
                    ClientSecret = _settings.ClientSecret
                },
                Scopes = new[] { GmailService.Scope.GmailSend }
            });

            var tokenResponse = new TokenResponse
            {
                AccessToken = string.IsNullOrWhiteSpace(_settings.AccessToken) ? null : _settings.AccessToken,
                RefreshToken = _settings.RefreshToken
            };

            var credential2 = new UserCredential(flow, _emailSettings.SenderEmail, tokenResponse);

            // Refresh token nếu không có AccessToken (Google API sẽ tự refresh khi cần)
            if (string.IsNullOrWhiteSpace(tokenResponse.AccessToken))
            {
                _logger?.LogInformation("Gmail OAuth2 access token không có. Đang refresh token...");
                var success = await credential2.RefreshTokenAsync(CancellationToken.None);
                if (!success)
                {
                    throw new InvalidOperationException("Không thể refresh Gmail OAuth2 token. Vui lòng kiểm tra lại credentials (ClientId, ClientSecret, RefreshToken).");
                }
                _logger?.LogInformation("Gmail OAuth2 token đã được refresh thành công.");
            }

            _gmailService = new GmailService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential2,
                ApplicationName = "Pawnder"
            });

            return _gmailService;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body, string fromEmail, string fromName)
        {
            var gmailService = await GetGmailServiceAsync();

            var message = CreateMessage(toEmail, subject, body, fromEmail, fromName);
            
            var request = gmailService.Users.Messages.Send(message, "me");
            await request.ExecuteAsync();
        }

        private Google.Apis.Gmail.v1.Data.Message CreateMessage(string toEmail, string subject, string body, string fromEmail, string fromName)
        {
            // Format date theo RFC 2822
            var date = DateTimeOffset.Now.ToString("ddd, dd MMM yyyy HH:mm:ss zzz", System.Globalization.CultureInfo.InvariantCulture);
            
            // Encode subject nếu có ký tự đặc biệt
            var encodedSubject = EncodeHeaderValue(subject);
            
            // Tạo raw email message theo RFC 2822 format
            var messageBuilder = new StringBuilder();
            messageBuilder.AppendLine($"From: {fromName} <{fromEmail}>");
            messageBuilder.AppendLine($"To: {toEmail}");
            messageBuilder.AppendLine($"Subject: {encodedSubject}");
            messageBuilder.AppendLine($"Date: {date}");
            messageBuilder.AppendLine("MIME-Version: 1.0");
            messageBuilder.AppendLine("Content-Type: text/html; charset=utf-8");
            messageBuilder.AppendLine();
            messageBuilder.Append(body);

            // Encode Base64URL (Base64 với các ký tự đặc biệt)
            var messageBytes = Encoding.UTF8.GetBytes(messageBuilder.ToString());
            var rawMessage = Convert.ToBase64String(messageBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .Replace("=", "");

            return new Google.Apis.Gmail.v1.Data.Message
            {
                Raw = rawMessage
            };
        }

        private static string EncodeHeaderValue(string value)
        {
            // Nếu không có ký tự đặc biệt, trả về nguyên bản
            if (value.All(c => c < 128 && !char.IsControl(c)))
                return value;

            // Encode bằng MIME encoded-word format
            var encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(value));
            return $"=?UTF-8?B?{encoded}?=";
        }
    }

    public class GmailOAuth2Settings
    {
        public string ClientId { get; set; } = null!;
        public string ClientSecret { get; set; } = null!;
        public string AccessToken { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
    }
}

