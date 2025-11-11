using Microsoft.AspNetCore.SignalR;

namespace BE.Services
{
    public class ChatHub : Hub
    {
        // Khi client gửi tin nhắn, ta có thể broadcast tại đây nếu muốn test riêng
        public async Task SendMessage(int matchId, int fromPetId, string message)
        {
            // Gửi tới tất cả client đang cùng matchId
            await Clients.All.SendAsync($"ReceiveMessage_{matchId}", new
            {
                MatchId = matchId,
                FromPetId = fromPetId,
                Message = message,
                CreatedAt = DateTime.Now
            });
        }
    }
}
