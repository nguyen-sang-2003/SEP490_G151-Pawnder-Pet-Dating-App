using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace BE.Services
{
    public class ChatHub : Hub
    {
        // Track user connections (userId -> list of connectionIds)
        public static readonly ConcurrentDictionary<int, HashSet<string>> UserConnections = new();
        
        // Track which users are online
        private static readonly ConcurrentDictionary<int, DateTime> OnlineUsers = new();

        /// <summary>
        /// Called when a client connects
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            Console.WriteLine($"[ChatHub] Client connected: {Context.ConnectionId}");
        }

        /// <summary>
        /// Called when a client disconnects
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Remove connection from all users
            foreach (var kvp in UserConnections)
            {
                if (kvp.Value.Remove(Context.ConnectionId))
                {
                    Console.WriteLine($"[ChatHub] User {kvp.Key} disconnected: {Context.ConnectionId}");
                    
                    // If user has no more connections, mark as offline
                    if (kvp.Value.Count == 0)
                    {
                        UserConnections.TryRemove(kvp.Key, out _);
                        OnlineUsers.TryRemove(kvp.Key, out _);
                        
                        // Notify others that user went offline
                        await Clients.All.SendAsync("UserOffline", kvp.Key);
                    }
                    break;
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Register user when they connect
        /// </summary>
        public async Task RegisterUser(int userId)
        {
            // Add connection to user's connection list
            if (!UserConnections.ContainsKey(userId))
            {
                UserConnections[userId] = new HashSet<string>();
            }
            UserConnections[userId].Add(Context.ConnectionId);
            
            // Mark user as online
            OnlineUsers[userId] = DateTime.UtcNow;
            
            Console.WriteLine($"✅✅✅ [ChatHub] User {userId} registered with connection {Context.ConnectionId}");
            Console.WriteLine($"[ChatHub] Total connections for user {userId}: {UserConnections[userId].Count}");
            Console.WriteLine($"[ChatHub] Total online users: {UserConnections.Count}");
            
            // Notify others that user is online
            await Clients.Others.SendAsync("UserOnline", userId);
        }

        /// <summary>
        /// Join a chat room (match)
        /// </summary>
        public async Task JoinChat(int matchId, int userId)
        {
            var groupName = $"Match_{matchId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            Console.WriteLine($"[ChatHub] User {userId} joined chat group {groupName}");
            
            // Notify other user in the chat that this user joined
            await Clients.OthersInGroup(groupName).SendAsync("UserJoinedChat", userId, matchId);
        }

        /// <summary>
        /// Leave a chat room (match)
        /// </summary>
        public async Task LeaveChat(int matchId, int userId)
        {
            var groupName = $"Match_{matchId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            Console.WriteLine($"[ChatHub] User {userId} left chat group {groupName}");
            
            // Notify other user that this user left
            await Clients.OthersInGroup(groupName).SendAsync("UserLeftChat", userId, matchId);
        }

        /// <summary>
        /// Join an expert chat room
        /// </summary>
        public async Task JoinExpertChat(int chatExpertId, int userId)
        {
            var groupName = $"ExpertChat_{chatExpertId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            Console.WriteLine($"[ChatHub] User {userId} joined expert chat group {groupName}");
        }

        /// <summary>
        /// Leave an expert chat room
        /// </summary>
        public async Task LeaveExpertChat(int chatExpertId, int userId)
        {
            var groupName = $"ExpertChat_{chatExpertId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            Console.WriteLine($"[ChatHub] User {userId} left expert chat group {groupName}");
        }

        /// <summary>
        /// Send a message to an expert chat room
        /// </summary>
        public async Task SendExpertMessage(int chatExpertId, int fromId, string message)
        {
            var groupName = $"ExpertChat_{chatExpertId}";
            
            Console.WriteLine($"[ChatHub] Sending expert message from user {fromId} to chat {chatExpertId}");
            
            // Send to all users in the expert chat group (including sender for confirmation)
            await Clients.Group(groupName).SendAsync("ReceiveExpertMessage", new
            {
                ChatExpertId = chatExpertId,
                FromId = fromId,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Send a message to a specific chat room
        /// </summary>
    public async Task SendMessage(int matchId, int fromUserId, string message, int? fromPetId = null)
        {
            var groupName = $"Match_{matchId}";
            
            Console.WriteLine($"[ChatHub] Sending message from user {fromUserId} to match {matchId}");
            
            // Send to all users in the chat group (including sender for confirmation)
            await Clients.Group(groupName).SendAsync("ReceiveMessage", new
            {
                MatchId = matchId,
            FromUserId = fromUserId,
            FromPetId = fromPetId,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Notify that user is typing
        /// </summary>
        public async Task Typing(int matchId, int userId, bool isTyping)
        {
            var groupName = $"Match_{matchId}";
            
            // Send to others in the group (not the sender)
            await Clients.OthersInGroup(groupName).SendAsync("UserTyping", new
            {
                UserId = userId,
                MatchId = matchId,
                IsTyping = isTyping
            });
        }

        /// <summary>
        /// Mark messages as read
        /// </summary>
        public async Task MarkAsRead(int matchId, int userId)
        {
            var groupName = $"Match_{matchId}";
            
            // Notify other user that messages were read
            await Clients.OthersInGroup(groupName).SendAsync("MessagesRead", new
            {
                MatchId = matchId,
                ReadByUserId = userId,
                ReadAt = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Check if user is online
        /// </summary>
        public bool IsUserOnline(int userId)
        {
            return OnlineUsers.ContainsKey(userId);
        }

        /// <summary>
        /// Get all online users
        /// </summary>
        public Task<List<int>> GetOnlineUsers()
        {
            return Task.FromResult(OnlineUsers.Keys.ToList());
        }

        /// <summary>
        /// Send notification to a specific user about new message badge (STATIC for use in controllers)
        /// </summary>
        public static async Task SendNewMessageBadge(IHubContext<ChatHub> hubContext, int toUserId, int matchId, int? fromPetId = null, int? toPetId = null)
        {
            if (UserConnections.TryGetValue(toUserId, out var connections))
            {
                foreach (var connectionId in connections)
                {
                    await hubContext.Clients.Client(connectionId).SendAsync("NewMessageBadge", new
                    {
                        MatchId = matchId,
                        FromPetId = fromPetId,
                        ToPetId = toPetId,
                        Timestamp = DateTime.UtcNow
                    });
                }
            }
        }

        /// <summary>
        /// Send notification to a specific user about new like (STATIC for use in controllers)
        /// </summary>
        public static async Task SendNewLikeBadge(IHubContext<ChatHub> hubContext, int toUserId, int fromUserId)
        {
            if (UserConnections.TryGetValue(toUserId, out var connections))
            {
                foreach (var connectionId in connections)
                {
                    await hubContext.Clients.Client(connectionId).SendAsync("NewLikeBadge", new
                    {
                        FromUserId = fromUserId,
                        Timestamp = DateTime.UtcNow
                    });
                }
            }
        }

        /// <summary>
        /// Send notification to a specific user about new expert message badge (STATIC for use in services)
        /// </summary>
        public static async Task SendNewExpertMessageBadge(IHubContext<ChatHub> hubContext, int toUserId, int chatExpertId)
        {
            if (UserConnections.TryGetValue(toUserId, out var connections))
            {
                foreach (var connectionId in connections)
                {
                    await hubContext.Clients.Client(connectionId).SendAsync("NewExpertMessageBadge", new
                    {
                        ChatExpertId = chatExpertId,
                        Timestamp = DateTime.UtcNow
                    });
                }
                Console.WriteLine($"✅ [ChatHub] Sent NewExpertMessageBadge to user {toUserId} for chat {chatExpertId}");
            }
            else
            {
                Console.WriteLine($"⚠️ [ChatHub] User {toUserId} is offline, badge will be shown on next app open");
            }
        }

        /// <summary>
        /// Send notification about new match (STATIC for use in controllers)
        /// </summary>
        public static async Task SendMatchNotification(IHubContext<ChatHub> hubContext, int toUserId, string otherUserName, int otherUserId, int matchId, string? petName, string? petPhotoUrl)
        {
            if (UserConnections.TryGetValue(toUserId, out var connections))
            {
                var payload = new
                {
                    MatchId = matchId,
                    OtherUserId = otherUserId,
                    OtherUserName = otherUserName,
                    PetName = petName,
                    PetPhotoUrl = petPhotoUrl,
                    Message = $"It's a Match with {otherUserName}! 🎉",
                    Timestamp = DateTime.UtcNow
                };
                
                foreach (var connectionId in connections)
                {
                    await hubContext.Clients.Client(connectionId).SendAsync("MatchSuccess", payload);
                }
            }
        }

        /// <summary>
        /// Send general notification to a specific user (STATIC for use in services)
        /// </summary>
        public static async Task SendNotification(IHubContext<ChatHub> hubContext, int toUserId, string title, string message, string type = "system")
        {
            // Debug: Show all currently connected users
            var connectedUsers = string.Join(", ", UserConnections.Keys);
            Console.WriteLine($"[ChatHub] Currently connected users: [{connectedUsers}]");
            Console.WriteLine($"[ChatHub] Trying to send notification to user {toUserId}");
            
            if (UserConnections.TryGetValue(toUserId, out var connections))
            {
                var payload = new
                {
                    Title = title,
                    Message = message,
                    Type = type,
                    Timestamp = DateTime.UtcNow
                };
                
                Console.WriteLine($"✅ [ChatHub] User {toUserId} is ONLINE with {connections.Count} connection(s)");
                Console.WriteLine($"[ChatHub] Sending notification: {title}");
                
                foreach (var connectionId in connections)
                {
                    Console.WriteLine($"   → Sending to connection: {connectionId}");
                    await hubContext.Clients.Client(connectionId).SendAsync("NewNotification", payload);
                }
                
                Console.WriteLine($"✅ [ChatHub] Notification sent successfully to user {toUserId}");
            }
            else
            {
                Console.WriteLine($"❌ [ChatHub] User {toUserId} is NOT connected (offline). Notification saved to DB only.");
                Console.WriteLine($"   Available users in connections: [{connectedUsers}]");
            }
        }

        /// <summary>
        /// Send notification when a match is deleted/unmatched (STATIC for use in services)
        /// </summary>
        public static async Task SendMatchDeletedNotification(IHubContext<ChatHub> hubContext, int toUserId, int matchId)
        {
            Console.WriteLine($"[ChatHub] Sending MatchDeleted notification to user {toUserId} for matchId {matchId}");
            
            if (UserConnections.TryGetValue(toUserId, out var connections))
            {
                var payload = new
                {
                    MatchId = matchId,
                    Timestamp = DateTime.UtcNow
                };
                
                Console.WriteLine($"✅ [ChatHub] User {toUserId} is ONLINE with {connections.Count} connection(s)");
                
                foreach (var connectionId in connections)
                {
                    await hubContext.Clients.Client(connectionId).SendAsync("MatchDeleted", payload);
                }
                
                Console.WriteLine($"✅ [ChatHub] MatchDeleted notification sent successfully to user {toUserId}");
            }
            else
            {
                Console.WriteLine($"⚠️ [ChatHub] User {toUserId} is offline, badge will be cleared on next badge refresh");
            }
        }

        /// <summary>
        /// Send notification with additional metadata (expertId, chatId) - for expert confirmations
        /// </summary>
        public static async Task SendNotificationWithMetadata(
            IHubContext<ChatHub> hubContext, 
            int toUserId, 
            string title, 
            string message, 
            string type,
            int? expertId = null,
            int? chatId = null)
        {
            var connectedUsers = string.Join(", ", UserConnections.Keys);
            Console.WriteLine($"[ChatHub] Currently connected users: [{connectedUsers}]");
            Console.WriteLine($"[ChatHub] Sending notification with metadata to user {toUserId}");
            
            if (UserConnections.TryGetValue(toUserId, out var connections))
            {
                var payload = new
                {
                    Title = title,
                    Message = message,
                    Type = type,
                    ExpertId = expertId,
                    ChatId = chatId,
                    Timestamp = DateTime.UtcNow
                };
                
                Console.WriteLine($"✅ [ChatHub] User {toUserId} is ONLINE with {connections.Count} connection(s)");
                Console.WriteLine($"[ChatHub] Sending notification: {title} (ExpertId={expertId}, ChatId={chatId})");
                
                foreach (var connectionId in connections)
                {
                    Console.WriteLine($"   → Sending to connection: {connectionId}");
                    await hubContext.Clients.Client(connectionId).SendAsync("NewNotification", payload);
                }
                
                Console.WriteLine($"✅ [ChatHub] Notification with metadata sent successfully!");
            }
            else
            {
                Console.WriteLine($"❌ [ChatHub] User {toUserId} is NOT connected (offline). Notification saved to DB only.");
                Console.WriteLine($"   Available users in connections: [{connectedUsers}]");
            }
        }

        /// <summary>
        /// Send expert chat message via SignalR (STATIC for use in services)
        /// </summary>
        public static async Task SendExpertMessage(IHubContext<ChatHub> hubContext, int chatExpertId, int fromId, string message, int? toUserId = null)
        {
            var groupName = $"ExpertChat_{chatExpertId}";
            
            var payload = new
            {
                ChatExpertId = chatExpertId,
                FromId = fromId,
                Message = message,
                CreatedAt = DateTime.UtcNow
            };
            
            Console.WriteLine($"[ChatHub] Sending expert message to group {groupName} from user {fromId}");
            Console.WriteLine($"[ChatHub] Connected users: [{string.Join(", ", UserConnections.Keys)}]");
            
            // ONLY send to group - both expert and user should join the group when they open the chat
            // Sending both to group AND directly causes duplicate messages on Railway
            await hubContext.Clients.Group(groupName).SendAsync("ReceiveExpertMessage", payload);
            Console.WriteLine($"[ChatHub] Sent to group {groupName} only (no direct send to avoid duplicates)");
            
            // Note: Removed direct send to toUserId because:
            // 1. If user/expert is in chat screen, they're already in the group and will receive via group message
            // 2. Sending both to group and directly causes duplicate messages (especially on Railway with reconnections)
            // 3. If they're not in the group (not in chat screen), they'll see the message when they open the chat
            // 4. The badge notification (SendNewExpertMessageBadge) will notify them of new messages
        }
    }
}
