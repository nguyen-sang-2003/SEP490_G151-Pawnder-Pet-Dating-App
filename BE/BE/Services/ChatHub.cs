using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace BE.Services
{
    public class ChatHub : Hub
    {
        // Track user connections (userId -> list of connectionIds)
        private static readonly ConcurrentDictionary<int, HashSet<string>> UserConnections = new();
        
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
            
            Console.WriteLine($"[ChatHub] User {userId} registered with connection {Context.ConnectionId}");
            
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
    }
}
