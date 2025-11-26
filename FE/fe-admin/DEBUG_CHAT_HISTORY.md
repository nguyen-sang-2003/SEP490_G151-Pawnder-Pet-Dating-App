# Hướng dẫn Debug "Chỉ hiển thị 2 tin nhắn thay vì 7"

## 🔍 Vấn đề

Database có **7 tin nhắn** nhưng frontend chỉ hiển thị **2 tin nhắn** (đang dùng fallback).

## 🛠️ Cách kiểm tra

### Bước 1: Mở Console (F12)

1. Mở Admin Panel → Vào "Thông báo chờ xác nhận"
2. Click "Xác nhận" cho một notification
3. Mở **Developer Tools** (F12) → Tab **Console**

### Bước 2: Xem các log quan trọng

Tìm các log sau:

#### ✅ Log bình thường (API thành công):
```
📋 Normalizing notification: { userId: X, chatAiId: 1, ... }
🔄 Fetching chat history for chatAiId: 1
📡 Calling API for chatAiId: 1
📥 API Response (full): { success: true, data: { messages: [...] } }
💬 Messages extracted: [Array(7)]
💬 Messages length: 7
✅ Processing 7 messages from API
✅ Created 14 chat history items from 7 API messages
✅ Returning 14 chat history items
✅ Chat history fetched, length: 14
```

#### ❌ Log lỗi (đang dùng fallback):
```
⚠️ chatAiId is missing or 0, using fallback
```
HOẶC
```
❌ Error loading chat history: ...
⚠️ Only 2 messages - might be using fallback!
```

### Bước 3: Kiểm tra Network Tab

1. Mở **Network** tab
2. Tìm request: `GET /api/chat-ai/{chatAiId}/messages`
3. Kiểm tra:
   - **Status**: 200 OK?
   - **Response**: Có `messages` array với 7 items không?

## 🔧 Các nguyên nhân và cách sửa

### Nguyên nhân 1: `chatAiId = 0` hoặc `null`

**Dấu hiệu:**
- Console log: `⚠️ chatAiId is missing or 0, using fallback`
- `📋 Normalizing notification` hiển thị `chatAiId: 0`

**Cách sửa:**
Kiểm tra database xem ExpertConfirmation có ChatAIId đúng không:

```sql
SELECT 
    ec."ChatAIId",
    ec."UserId",
    ec."ExpertId",
    cai."Title"
FROM "ExpertConfirmation" ec
LEFT JOIN "ChatAI" cai ON ec."ChatAIId" = cai."ChatAIId"
WHERE ec."Status" = 'Pending';
```

Nếu ChatAIId = 0 hoặc NULL, cập nhật:

```sql
UPDATE "ExpertConfirmation"
SET "ChatAIId" = (SELECT "ChatAIId" FROM "ChatAI" WHERE "Title" = 'Tư vấn giống chó phù hợp' LIMIT 1)
WHERE "ChatAIId" IS NULL OR "ChatAIId" = 0;
```

### Nguyên nhân 2: API trả về lỗi

**Dấu hiệu:**
- Console log: `❌ Error loading chat history: ...`
- Network tab: Status 404 hoặc 500

**Cách sửa:**
1. Kiểm tra backend có chạy không: `http://localhost:5297`
2. Kiểm tra ChatAIId có tồn tại trong database không
3. Test API trực tiếp:

```javascript
// Trong Browser Console
const token = localStorage.getItem('access_token');
const chatAiId = 1; // Thay bằng ChatAIId thực tế

fetch(`http://localhost:5297/api/chat-ai/${chatAiId}/messages`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Nguyên nhân 3: Response format không đúng

**Dấu hiệu:**
- Console log: `💬 Messages is not an array` hoặc `Messages array is empty`
- API trả về nhưng format khác

**Cách sửa:**
Kiểm tra format response từ API. Backend nên trả về:

```json
{
  "success": true,
  "data": {
    "chatTitle": "...",
    "messages": [
      {
        "contentId": 1,
        "question": "...",
        "answer": "...",
        "createdAt": "..."
      },
      ...
    ]
  }
}
```

### Nguyên nhân 4: API không được gọi

**Dấu hiệu:**
- Không thấy log `📡 Calling API for chatAiId`
- Network tab không có request `/api/chat-ai/{chatAiId}/messages`

**Cách sửa:**
Kiểm tra:
1. `expertService.getChatHistory` có được import đúng không
2. API endpoint có đúng không trong `constants/index.js`

## 📝 Checklist Debug

- [ ] Console có log `📋 Normalizing notification` với `chatAiId > 0`
- [ ] Console có log `📡 Calling API for chatAiId: X`
- [ ] Console có log `📥 API Response` với dữ liệu
- [ ] Console có log `💬 Messages length: 7` (hoặc số lượng đúng)
- [ ] Console có log `✅ Created X chat history items`
- [ ] Network tab có request `/api/chat-ai/{chatAiId}/messages` với status 200
- [ ] Response có `messages` array với 7 items

## 🎯 Kết quả mong đợi

Sau khi sửa, bạn sẽ thấy:
- ✅ Console log: `✅ Created 14 chat history items from 7 API messages`
- ✅ Frontend hiển thị: **"14 tin nhắn"** (7 cặp Q&A = 14 tin nhắn)
- ✅ Khi mở rộng, thấy đầy đủ 7 cặp câu hỏi-trả lời

## 💡 Lưu ý

- Database có **7 records** trong `ChatAIContent`
- Frontend sẽ hiển thị **14 tin nhắn** (vì mỗi record có 1 Question + 1 Answer)
- Nếu chỉ thấy **2 tin nhắn**, có nghĩa là đang dùng `buildFallbackHistory` (fallback)

