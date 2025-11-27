# Hướng dẫn thiết lập Chat Expert

## ✅ Đã hoàn thành

1. ✅ **Service API** (`chatExpertService.js`) - Gọi API backend
2. ✅ **Màn Chat Expert** (`ExpertChat.js`) - UI giống messenger
3. ✅ **SignalR Client** - Đã tích hợp (cần backend hỗ trợ)
4. ✅ **Menu Sidebar** - Đã thêm "Chat với người dùng"
5. ✅ **Routing** - Đã thêm route `/expert/chat`

## 📋 Luồng hoạt động

1. **Expert confirm xác nhận** → Gửi notification cho user
2. **User muốn chat** → Truy cập FE-user app → Chọn chat với expert
3. **Expert nhận được** → Mở màn chat → Hiển thị đoạn chat với user
4. **Realtime chat** → Dùng SignalR để chat trực tiếp

## 🔧 Cần cập nhật Backend (Tùy chọn - để realtime hoạt động đầy đủ)

### 1. Thêm method `JoinChatGroup` vào ChatHub.cs

```csharp
/// <summary>
/// Join a chat expert group
/// </summary>
public async Task JoinChatGroup(string groupName)
{
    await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    Console.WriteLine($"[ChatHub] Connection {Context.ConnectionId} joined group {groupName}");
}
```

### 2. Cập nhật ChatExpertContentService.cs để gửi SignalR notification

Thêm `IHubContext<ChatHub>` vào constructor và gửi notification sau khi lưu message:

```csharp
private readonly IHubContext<ChatHub> _hubContext;

public ChatExpertContentService(
    IChatExpertContentRepository contentRepository,
    IChatExpertRepository chatExpertRepository,
    PawnderDatabaseContext context,
    IHubContext<ChatHub> hubContext)
{
    _contentRepository = contentRepository;
    _chatExpertRepository = chatExpertRepository;
    _context = context;
    _hubContext = hubContext;
}

// Trong SendMessageAsync, sau khi lưu message:
var groupName = $"chat-expert-{chatExpertId}";
var messageData = new
{
    contentId = chatMessage.ContentId,
    chatExpertId = chatMessage.ChatExpertId,
    fromId = chatMessage.FromId,
    message = chatMessage.Message,
    expertId = chatMessage.ExpertId,
    userId = chatMessage.UserId,
    chatAiid = chatMessage.ChatAiid,
    createdAt = chatMessage.CreatedAt
};

// Gửi đến cả expert và user
await _hubContext.Clients.Group(groupName).SendAsync("ReceiveMessage", messageData);

// Gửi notification riêng cho người nhận
var recipientId = fromId == chatExpert.ExpertId ? chatExpert.UserId : chatExpert.ExpertId;
if (ChatHub.UserConnections.TryGetValue(recipientId, out var connections))
{
    foreach (var connectionId in connections)
    {
        await _hubContext.Clients.Client(connectionId).SendAsync("NewExpertChatMessage", new
        {
            ChatExpertId = chatExpertId,
            FromId = fromId,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }
}
```

### 3. Đăng ký IHubContext trong Program.cs

Đảm bảo đã có:
```csharp
builder.Services.AddSignalR();
```

## 🚀 Cách sử dụng

### Expert:
1. Đăng nhập với tài khoản Expert
2. Vào menu **"Chat với người dùng"** trong sidebar
3. Chọn một cuộc trò chuyện từ danh sách bên trái
4. Gửi tin nhắn trong chat window bên phải

### User (FE-User app):
1. Nhận notification khi expert confirm
2. Vào app → Chọn "Chat với Expert"
3. Chọn expert muốn chat
4. Gửi tin nhắn

## 📝 API Endpoints sử dụng

- `GET /api/chat-expert/expert/{expertId}` - Lấy danh sách chat của expert
- `GET /api/chat-expert-content/{chatExpertId}` - Lấy tin nhắn của một chat
- `POST /api/chat-expert-content/{chatExpertId}/{fromId}` - Gửi tin nhắn
- `POST /api/chat-expert/{expertId}/{userId}` - Tạo chat mới

## 🔌 SignalR Hub

- Hub URL: `/chatHub`
- Methods:
  - `RegisterUser(userId)` - Đăng ký user
  - `JoinChatGroup(groupName)` - Tham gia group chat (cần thêm vào backend)
- Events:
  - `ReceiveMessage` - Nhận tin nhắn mới
  - `NewExpertChatMessage` - Notification tin nhắn mới (cần thêm vào backend)

## ⚠️ Lưu ý

- Nếu backend chưa có SignalR notification, frontend vẫn hoạt động nhưng không realtime
- Cần refresh để thấy tin nhắn mới nếu chưa có SignalR
- Đảm bảo backend đã cấu hình CORS cho SignalR

