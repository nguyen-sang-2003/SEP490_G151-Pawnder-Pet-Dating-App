# Hướng dẫn Debug "Đang tải..." trong Expert Chat

## 🔍 Nguyên nhân có thể

1. **API không trả về dữ liệu** - Chưa có chat trong database
2. **Lỗi API** - Endpoint không đúng hoặc lỗi authentication
3. **User ID không đúng** - Expert ID không khớp
4. **Backend chưa chạy** - API không phản hồi

## 🛠️ Cách kiểm tra

### Bước 1: Kiểm tra Console (F12)

Mở Developer Tools → Console và xem các log:
- ✅ `📡 Loading chats for expert: {expertId}` - Đang gọi API
- ✅ `📥 API Response: {...}` - Response từ backend
- ✅ `💬 Chats data: [...]` - Dữ liệu chats
- ❌ `❌ Failed to load chats:` - Có lỗi xảy ra

### Bước 2: Kiểm tra Network Tab

1. Mở Developer Tools → Network
2. Refresh trang
3. Tìm request: `GET /api/chat-expert/expert/{expertId}`
4. Kiểm tra:
   - **Status**: 200 OK (thành công) hoặc 404/500 (lỗi)
   - **Response**: Xem dữ liệu trả về

### Bước 3: Kiểm tra Database

Chạy query trong pgAdmin để xem có chat nào không:

```sql
-- Kiểm tra Expert ID của user đang đăng nhập
SELECT "UserId", "Email", "FullName", "RoleId" 
FROM "User" 
WHERE "Email" = 'expert@pawnder.com'; -- Thay bằng email expert của bạn

-- Kiểm tra có chat nào với expert này không
SELECT 
    ce."ChatExpertId",
    ce."ExpertId",
    ce."UserId",
    ce."CreatedAt",
    u."FullName" as "UserName",
    e."FullName" as "ExpertName"
FROM "ChatExpert" ce
LEFT JOIN "User" u ON ce."UserId" = u."UserId"
LEFT JOIN "User" e ON ce."ExpertId" = e."UserId"
WHERE ce."ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email" = 'expert@pawnder.com');
```

### Bước 4: Test API trực tiếp

Mở Browser Console và chạy:

```javascript
// Lấy token
const token = localStorage.getItem('access_token');
const expertId = 2; // Thay bằng Expert ID thực tế

// Test API
fetch(`http://localhost:5297/api/chat-expert/expert/${expertId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ API Response:', data);
  console.log('📊 Is Array:', Array.isArray(data));
  console.log('📊 Length:', Array.isArray(data) ? data.length : 'Not an array');
})
.catch(err => {
  console.error('❌ API Error:', err);
});
```

## 🔧 Cách sửa

### Nếu chưa có dữ liệu chat:

Tạo chat mẫu trong database:

```sql
-- Tạo chat giữa expert và user1
INSERT INTO "ChatExpert" ("ExpertId", "UserId")
VALUES
(
  (SELECT "UserId" FROM "User" WHERE "Email" = 'expert@pawnder.com'),
  (SELECT "UserId" FROM "User" WHERE "Email" = 'user1@pawnder.com')
);

-- Thêm tin nhắn mẫu
INSERT INTO "ChatExpertContent" ("ChatExpertId", "FromId", "Message", "ExpertId", "UserId")
VALUES
(
  (SELECT "ChatExpertId" FROM "ChatExpert" 
   WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email" = 'expert@pawnder.com')
   AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email" = 'user1@pawnder.com')
   LIMIT 1),
  (SELECT "UserId" FROM "User" WHERE "Email" = 'user1@pawnder.com'),
  'Xin chào chuyên gia, tôi có câu hỏi về thú cưng của tôi.',
  (SELECT "UserId" FROM "User" WHERE "Email" = 'expert@pawnder.com'),
  (SELECT "UserId" FROM "User" WHERE "Email" = 'user1@pawnder.com')
);
```

### Nếu API trả về lỗi 404:

Kiểm tra:
1. Backend đang chạy: `http://localhost:5297`
2. Route đúng: `/api/chat-expert/expert/{expertId}`
3. Expert ID đúng trong database

### Nếu API trả về lỗi 403 (Forbidden):

Kiểm tra:
1. Token còn hợp lệ không
2. User có role "Expert" không
3. Expert ID trong token có khớp với Expert ID trong database không

## 📝 Checklist

- [ ] Backend đang chạy (`http://localhost:5297`)
- [ ] Đã đăng nhập với tài khoản Expert
- [ ] Console không có lỗi JavaScript
- [ ] Network tab có request `/api/chat-expert/expert/{expertId}`
- [ ] Database có dữ liệu chat cho expert này
- [ ] API trả về status 200 OK

## 🎯 Kết quả mong đợi

Sau khi sửa, bạn sẽ thấy:
- ✅ Danh sách chat bên trái (không còn "Đang tải...")
- ✅ Có thể chọn chat và xem tin nhắn
- ✅ Console log hiển thị dữ liệu chats

