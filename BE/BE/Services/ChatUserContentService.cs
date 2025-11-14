using BE.Models;
using BE.Repositories.Interfaces;
using BE.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BE.Services
{
    public class ChatUserContentService : IChatUserContentService
    {
        private readonly IChatUserContentRepository _contentRepository;
        private readonly IChatUserRepository _chatUserRepository;
        private readonly PawnderDatabaseContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatUserContentService(
            IChatUserContentRepository contentRepository,
            IChatUserRepository chatUserRepository,
            PawnderDatabaseContext context,
            IHubContext<ChatHub> hubContext)
        {
            _contentRepository = contentRepository;
            _chatUserRepository = chatUserRepository;
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<IEnumerable<object>> GetChatMessagesAsync(int matchId, CancellationToken ct = default)
        {
            var exists = await _contentRepository.ChatExistsAsync(matchId, ct);
            if (!exists)
                throw new KeyNotFoundException("Không tìm thấy đoạn chat.");

            var messages = await _contentRepository.GetChatMessagesAsync(matchId, ct);
            if (!messages.Any())
                throw new KeyNotFoundException("Không tìm thấy nội dung trò chuyện.");

            return messages;
        }

        public async Task<object> SendMessageAsync(int matchId, int fromPetId, string message, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(message))
                throw new ArgumentException("Tin nhắn không được để trống.");

            // Business logic: Validate match exists and is accepted
            var match = await _context.ChatUsers
                .FirstOrDefaultAsync(c => c.MatchId == matchId && c.Status == "Accepted" && c.IsDeleted == false, ct);
            if (match == null)
                throw new KeyNotFoundException("Không tồn tại đoạn chat.");

            // Business logic: Validate pet belongs to this chat
            if (match.FromPetId != fromPetId && match.ToPetId != fromPetId)
                throw new InvalidOperationException("Pet không thuộc cuộc chat này.");

            // Business logic: Create message
            var now = DateTime.Now;
            var chatMessage = new ChatUserContent
            {
                MatchId = matchId,
                FromPetId = fromPetId,
                Message = message,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _contentRepository.AddAsync(chatMessage, ct);

            // Business logic: Send SignalR notification
            var groupName = $"Match_{matchId}";
            await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", new
            {
                MatchId = matchId,
                FromPetId = fromPetId,
                Message = message,
                CreatedAt = chatMessage.CreatedAt
            });

            // Business logic: Send badge notification to recipient
            int? toUserId = null;
            if (match.FromPetId == fromPetId)
            {
                toUserId = match.ToUserId;
            }
            else if (match.ToPetId == fromPetId)
            {
                toUserId = match.FromUserId;
            }

            if (toUserId.HasValue)
            {
                try
                {
                    await ChatHub.SendNewMessageBadge(_hubContext, toUserId.Value, matchId, match.FromPetId, match.ToPetId);
                }
                catch (Exception notifEx)
                {
                    Console.WriteLine($"[SendMessage] Error sending badge notification: {notifEx.Message}");
                }
            }

            return new
            {
                message = "Gửi tin nhắn thành công.",
                contentId = chatMessage.ContentId,
                createdAt = chatMessage.CreatedAt
            };
        }
    }
}




