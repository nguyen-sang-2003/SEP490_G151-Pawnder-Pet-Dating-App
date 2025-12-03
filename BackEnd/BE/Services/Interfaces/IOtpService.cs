namespace BE.Services.Interfaces
{
    public interface IOtpService
    {
        Task<object> SendOtpAsync(string email, string purpose = "register", CancellationToken ct = default);
        Task<bool> CheckOtpAsync(string email, string otp, CancellationToken ct = default);
    }
}




