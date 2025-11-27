# Hướng dẫn test API Chat History

## Bước 1: Lấy ChatAIId
Chạy query trong pgAdmin:
```sql
SELECT "ChatAIId", "Title" FROM "ChatAI" WHERE "Title" = 'Tư vấn giống chó phù hợp';
```

## Bước 2: Test API trong Browser Console
1. Mở Admin Panel: http://localhost:3000
2. Đăng nhập với tài khoản expert hoặc admin
3. Mở Developer Tools (F12) → Console
4. Chạy lệnh sau (thay `1` bằng ChatAIId thực tế):

```javascript
// Lấy token từ localStorage
const token = localStorage.getItem('access_token');

// Gọi API
fetch('http://localhost:5297/api/chat-ai/1/messages', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ API Response:', data);
  console.log('📊 Số tin nhắn:', data.data?.messages?.length || 0);
  console.log('💬 Tin nhắn:', data.data?.messages);
})
.catch(err => console.error('❌ Lỗi:', err));
```

## Kết quả mong đợi:
- `success: true`
- `data.messages.length = 6` (6 tin nhắn)
- Mỗi message có `question` và `answer`

