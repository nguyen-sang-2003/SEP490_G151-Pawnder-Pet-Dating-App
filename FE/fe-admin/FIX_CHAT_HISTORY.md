# Hướng dẫn sửa lỗi "Chỉ hiển thị 2 tin nhắn"

## Nguyên nhân có thể:
1. ✅ Database chưa được cập nhật (vẫn còn dữ liệu cũ 2 tin nhắn)
2. ✅ ChatAIId trong ExpertConfirmation = 0 hoặc NULL
3. ✅ API không trả về đúng dữ liệu

## Các bước sửa:

### Bước 1: Cập nhật Database
1. Mở **pgAdmin** → Kết nối database `pawnder_database`
2. Chạy file: `database/update_chat_history.sql`
   - Script này sẽ:
     - Xóa dữ liệu cũ (2 tin nhắn)
     - Thêm lại 6 tin nhắn mới
     - Kiểm tra kết quả

3. Chạy file: `database/fix_expert_confirmation.sql`
   - Script này sẽ:
     - Kiểm tra ChatAIId trong ExpertConfirmation
     - Cập nhật nếu ChatAIId = 0 hoặc NULL

### Bước 2: Kiểm tra Database
Chạy query này để xác nhận:
```sql
SELECT 
    cai."ChatAIId",
    cai."Title",
    COUNT(cac."ContentId") as "Số tin nhắn"
FROM "ChatAI" cai
LEFT JOIN "ChatAIContent" cac ON cai."ChatAIId" = cac."ChatAIId"
WHERE cai."Title" = 'Tư vấn giống chó phù hợp'
GROUP BY cai."ChatAIId", cai."Title";
```
**Kết quả mong đợi:** 6 tin nhắn

### Bước 3: Kiểm tra ExpertConfirmation
```sql
SELECT 
    ec."ChatAIId",
    cai."Title",
    ec."Status"
FROM "ExpertConfirmation" ec
LEFT JOIN "ChatAI" cai ON ec."ChatAIId" = cai."ChatAIId"
WHERE cai."Title" = 'Tư vấn giống chó phù hợp';
```
**Kết quả mong đợi:** ChatAIId phải là số > 0 (không phải 0 hoặc NULL)

### Bước 4: Restart Backend
1. Dừng backend (Ctrl+C)
2. Chạy lại: `dotnet run` (hoặc F5 trong Visual Studio)

### Bước 5: Restart Frontend
1. Dừng frontend (Ctrl+C)
2. Xóa cache: `npm start` (hoặc refresh browser với Ctrl+Shift+R)

### Bước 6: Kiểm tra Console Log
1. Mở Admin Panel: http://localhost:3000
2. Đăng nhập với tài khoản Expert
3. Mở **Developer Tools** (F12) → Tab **Console**
4. Vào "Quản lý thông báo" → Click "Xác nhận"
5. Xem console log:
   - ✅ `📋 Normalizing notification:` - Xem `chatAiId` có giá trị > 0 không
   - ✅ `🔍 fetchChatHistory called with chatAiId:` - Xem giá trị chatAiId
   - ✅ `📡 Calling API for chatAiId:` - Xem API có được gọi không
   - ✅ `📥 API Response:` - Xem response từ backend
   - ✅ `💬 Messages extracted:` - Xem số lượng messages

### Bước 7: Kiểm tra Network Tab
1. Mở **Developer Tools** (F12) → Tab **Network**
2. Filter: `messages`
3. Click "Xác nhận" trong modal
4. Tìm request: `GET /api/chat-ai/{chatAiId}/messages`
5. Kiểm tra:
   - ✅ Status: 200 OK
   - ✅ Response có `data.messages` với 6 items

## Nếu vẫn không hoạt động:

### Kiểm tra API trực tiếp:
1. Lấy token từ localStorage:
   ```javascript
   localStorage.getItem('access_token')
   ```
2. Lấy ChatAIId từ database (bước 2)
3. Test API trong Postman hoặc Browser Console:
   ```javascript
   fetch('http://localhost:5297/api/chat-ai/1/messages', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   .then(r => r.json())
   .then(console.log)
   ```

### Kiểm tra Backend Log:
- Xem console của backend có lỗi gì không
- Kiểm tra xem API có được gọi không

## Kết quả mong đợi:
- ✅ Database có **6 tin nhắn** cho chat "Tư vấn giống chó phù hợp"
- ✅ ExpertConfirmation có **ChatAIId > 0**
- ✅ Frontend hiển thị **"6 tin nhắn"** (hoặc "12 tin nhắn" nếu đếm cả Q&A)
- ✅ Khi mở rộng, thấy đầy đủ **6 cặp Q&A**

