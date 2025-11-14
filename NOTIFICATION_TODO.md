# Notification Feature - Complete! ✅

## 📋 Quy tắc Notification
- **Notification table CHỈ dùng cho Admin và Expert notifications**
- **Match notifications KHÔNG lưu vào DB** - chỉ dùng SignalR real-time
- Users xem matches của họ ở Chat/Favorite tabs, không cần notification trong DB

## ✅ Đã hoàn thành

### Frontend
1. ✅ Sửa hardcode số 2 trong HomeScreen notification badge
2. ✅ Tạo API client cho notifications (`FE/FE-User/src/api/notification.ts`)
3. ✅ Cập nhật NotificationScreen để lấy dữ liệu từ database
4. ✅ Sửa endpoint từ `/api/notifications/{userId}` thành `/api/notification/user/{userId}`
5. ✅ Thêm loading state và pull-to-refresh
6. ✅ Cập nhật filter tabs: All / System / Expert (xóa Matches/Likes/Messages)
7. ✅ Cập nhật BadgeCounts interface để nhận notificationBadge
8. ✅ Enable mark as read và mark all as read
9. ✅ Xóa logic tăng notification badge khi match (useBadgeNotifications)
10. ✅ Xóa avatar khỏi notification items
11. ✅ Cập nhật empty state messages cho system và expert

### Backend
1. ✅ Thêm trường `IsRead`, `Type`, `RelatedUserId`, `MatchId` vào Notification model
2. ✅ Cập nhật PawnderDatabaseContext để map các trường mới
3. ✅ Thêm endpoint `PUT /api/notification/{notificationId}/read`
4. ✅ Thêm endpoint `PUT /api/notification/user/{userId}/read-all`
5. ✅ Thêm endpoint `GET /api/notification/user/{userId}/unread-count`
6. ✅ Cập nhật `GET /api/match/badge-counts/{userId}` để chỉ đếm system và expert_reply
7. ✅ Xóa logic lưu match notification vào DB (CreateMatchNotification)
8. ✅ Cập nhật GetNotificationsByUserId để chỉ trả về system và expert_reply
9. ✅ Cập nhật GetUnreadCount để chỉ đếm system và expert_reply
10. ✅ Tạo migration SQL để thêm các cột mới (`BE/Migrations/AddNotificationFields.sql`)

## 🔧 Cần làm để deploy

### 1. Chạy Migration SQL
Chạy file `BE/Migrations/AddNotificationFields.sql` trên database production:
```bash
psql -U your_user -d pawnder_db -f BE/Migrations/AddNotificationFields.sql
```

### 2. Test Notification Badge
- Badge count sẽ được load từ API khi app khởi động
- Badge chỉ hiển thị khi có unread system hoặc expert notifications
- Match notifications không ảnh hưởng đến badge count

### 3. Tạo Notification từ Admin/Expert
Khi admin hoặc expert muốn gửi notification:
```csharp
var notification = new Notification
{
    UserId = targetUserId,
    Type = "system", // hoặc "expert_reply"
    Title = "Welcome to Pawnder!",
    Message = "Complete your pet profile to get more matches",
    IsRead = false,
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};

_context.Notifications.Add(notification);
await _context.SaveChangesAsync();
```

## 📊 Notification Types
- `system` - Thông báo từ admin/hệ thống
- `expert_reply` - Phản hồi từ chuyên gia

## 🚫 Không sử dụng
- `match` - KHÔNG lưu vào DB (chỉ SignalR real-time)
- `like` - KHÔNG lưu vào DB (xem ở Favorite tab)
- `message` - KHÔNG lưu vào DB (xem ở Chat tab)
