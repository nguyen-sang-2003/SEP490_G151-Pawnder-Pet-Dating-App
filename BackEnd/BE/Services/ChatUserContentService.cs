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
        private readonly IBadWordService _badWordService;

        public ChatUserContentService(
            IChatUserContentRepository contentRepository,
            IChatUserRepository chatUserRepository,
            PawnderDatabaseContext context,
            IHubContext<ChatHub> hubContext,
            IBadWordService badWordService)
        {
            _contentRepository = contentRepository;
            _chatUserRepository = chatUserRepository;
            _context = context;
            _hubContext = hubContext;
            _badWordService = badWordService;
        }

        public async Task<IEnumerable<object>> GetChatMessagesAsync(int matchId, CancellationToken ct = default)
        {
            var exists = await _contentRepository.ChatExistsAsync(matchId, ct);
            if (!exists)
                throw new KeyNotFoundException("Không tìm thấy đoạn chat.");

            var messages = await _contentRepository.GetChatMessagesAsync(matchId, ct);
            
            // Return empty array if no messages yet (newly matched chat)
            // Don't throw exception - allow empty chat to be displayed
            return messages;
        }

        public async Task<object> SendMessageAsync(int matchId, int fromUserId, string message, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(message))
                throw new ArgumentException("Tin nhắn không được để trống.");

            // Business logic: Kiểm tra từ cấm
            var (isBlocked, filteredMessage, violationLevel) = await _badWordService.CheckAndFilterMessageAsync(message, ct);
            
            if (isBlocked)
            {
                throw new InvalidOperationException("Tin nhắn của bạn chứa nội dung không phù hợp và không thể gửi.");
            }

            // Sử dụng filteredMessage (đã che từ Level 1)
            message = filteredMessage;

            // Business logic: Validate match exists and is accepted
            var match = await _context.ChatUsers
                .Include(c => c.FromPet)
                .Include(c => c.ToPet)
                .FirstOrDefaultAsync(c => c.MatchId == matchId && c.Status == "Accepted" && c.IsDeleted == false, ct);
            if (match == null)
                throw new KeyNotFoundException("Không tồn tại đoạn chat.");

            // Business logic: Find which pet belongs to the user in this match
            int? fromPetId = null;
            int? toUserId = null;
            
            if (match.FromPet != null && match.FromPet.UserId == fromUserId)
            {
                fromPetId = match.FromPetId;
                toUserId = match.ToPet?.UserId;
            }
            else if (match.ToPet != null && match.ToPet.UserId == fromUserId)
            {
                fromPetId = match.ToPetId;
                toUserId = match.FromPet?.UserId;
            }
            
            if (fromPetId == null)
                throw new InvalidOperationException("Người dùng không thuộc cuộc chat này.");

            // Business logic: Create message
            // Use UTC time but remove Kind for PostgreSQL compatibility
            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            var chatMessage = new ChatUserContent
            {
                MatchId = matchId,
                FromUserId = fromUserId,
                FromPetId = fromPetId,
                Message = message,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _contentRepository.AddAsync(chatMessage, ct);

            // Business logic: Send SignalR notification
            var groupName = $"Match_{matchId}";
            var messageData = new
            {
                MatchId = matchId,
                FromUserId = fromUserId,
                Message = message,
                CreatedAt = chatMessage.CreatedAt
            };
            
            // Send to group (people in ChatDetail screen)
            await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", messageData);

            // Business logic: Send notification to recipient (for ChatScreen and badge)
            if (toUserId.HasValue)
            {
                try
                {
                    // Send ReceiveMessage directly to recipient (for ChatScreen)
                    if (ChatHub.UserConnections.TryGetValue(toUserId.Value, out var connections))
                    {
                        foreach (var connectionId in connections)
                        {
                            await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveMessage", messageData);
                        }
                    }
                    
                    // Send badge notification
                    // Send fromPetId (sender) and toPetId (recipient) so frontend can decide whether to show badge
                    // Determine which pet is receiving the message
                    int? recipientPetId = (match.FromPetId == fromPetId) ? match.ToPetId : match.FromPetId;
                    
                    Console.WriteLine($"[SendMessage] Sending badge notification: toUserId={toUserId.Value}, matchId={matchId}, fromPetId={fromPetId}, recipientPetId={recipientPetId}");
                    await ChatHub.SendNewMessageBadge(_hubContext, toUserId.Value, matchId, fromPetId, recipientPetId);
                }
                catch (Exception notifEx)
                {
                    Console.WriteLine($"[SendMessage] Error sending notification to recipient: {notifEx.Message}");
                }
            }

            return new
            {
                message = chatMessage.Message, // Return the filtered message
                contentId = chatMessage.ContentId,
                createdAt = chatMessage.CreatedAt
            };
        }
    }
}




