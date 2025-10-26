using Microsoft.Extensions.Options;
using System.Net;
using System.Text.Json;

namespace BE.Services
{
    public class KickboxSettings
    {
        public string ApiKey { get; set; } = null!;
        public string Endpoint { get; set; } = null!;
    }

    public interface IKickboxClient
    {
        Task<KickboxResponse> VerifyEmailAsync(string email);
    }

    public class KickboxClient : IKickboxClient
    {
        private readonly KickboxSettings _settings;
        private readonly HttpClient _httpClient;

        public KickboxClient(IOptions<KickboxSettings> settings, HttpClient httpClient)
        {
            _settings = settings.Value;
            _httpClient = httpClient;
        }

        public async Task<KickboxResponse> VerifyEmailAsync(string email)
        {
            var url = $"{_settings.Endpoint}?email={WebUtility.UrlEncode(email)}&apikey={_settings.ApiKey}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<KickboxResponse>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        }
    }

    public class KickboxResponse
    {
        public string Result { get; set; } = null!;
        public string Reason { get; set; } = null!;
    }
}
