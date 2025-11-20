# Hướng dẫn kiểm tra xác nhận có lưu vào database không

## 🔍 Cách kiểm tra

### Bước 1: Xác nhận một notification

1. Đăng nhập với tài khoản **Expert**
2. Vào **"Thông báo chờ xác nhận"**
3. Click **"Xác nhận"** cho một notification
4. Nhập ghi chú (ví dụ: "Thông tin AI đúng, đã xác nhận")
5. Click **"Xác nhận và gửi"**

### Bước 2: Kiểm tra Console (Frontend)

Mở **Developer Tools** (F12) → Tab **Console** và xem:

#### ✅ Log thành công:
```
📤 Sending confirmation: { expertId: X, userId: Y, chatAiId: Z, ... }
✅ Confirmation response: { Status: "confirmed", Message: "...", ... }
```

#### ❌ Log lỗi:
```
❌ Lỗi khi xác nhận thông báo: ...
Error details: { message: "...", status: 404/500, ... }
```

### Bước 3: Kiểm tra Backend Console

Xem console của backend (terminal chạy `dotnet run`) và tìm:

#### ✅ Log thành công:
```
[ExpertConfirmationService] UpdateExpertConfirmationAsync called: expertId=X, userId=Y, chatId=Z
[ExpertConfirmationService] Found ExpertConfirmation: Status=Pending, Message=...
[ExpertConfirmationService] Updating: Status Pending -> confirmed
[ExpertConfirmationService] Successfully saved to database: Status=confirmed, UpdatedAt=...
```

#### ❌ Log lỗi:
```
[ExpertConfirmationService] ExpertConfirmation not found: expertId=X, userId=Y, chatId=Z
```

### Bước 4: Kiểm tra Database

Chạy file SQL: `database/check_expert_confirmation.sql` trong pgAdmin

Hoặc chạy query này:

```sql
-- Xem tất cả ExpertConfirmation sau khi xác nhận
SELECT 
    ec."ExpertId",
    ec."UserId",
    ec."ChatAIId",
    ec."Status",
    ec."Message" as "ExpertMessage",
    ec."CreatedAt",
    ec."UpdatedAt",
    CASE 
        WHEN ec."UpdatedAt" > ec."CreatedAt" THEN 'Đã cập nhật'
        ELSE 'Chưa cập nhật'
    END as "Trạng thái",
    e."FullName" as "ExpertName",
    u."FullName" as "UserName"
FROM "ExpertConfirmation" ec
LEFT JOIN "User" e ON ec."ExpertId" = e."UserId"
LEFT JOIN "User" u ON ec."UserId" = u."UserId"
ORDER BY ec."UpdatedAt" DESC;
```

## ✅ Kết quả mong đợi

Sau khi xác nhận, bạn sẽ thấy:

1. **Frontend Console:**
   - ✅ `📤 Sending confirmation` - API được gọi
   - ✅ `✅ Confirmation response` - Response thành công
   - ✅ Alert: "Đã xác nhận thông báo thành công! Dữ liệu đã được lưu vào database."

2. **Backend Console:**
   - ✅ `Successfully saved to database` - Đã lưu vào DB

3. **Database:**
   - ✅ `Status` = `'Confirmed'` hoặc `'confirmed'`
   - ✅ `Message` = Ghi chú bạn đã nhập
   - ✅ `UpdatedAt` > `CreatedAt` (đã được cập nhật)

## 🔧 Nếu không lưu được

### Kiểm tra lỗi:

1. **Frontend Console có lỗi không?**
   - Nếu có lỗi 404: ExpertConfirmation không tồn tại
   - Nếu có lỗi 500: Backend có lỗi

2. **Backend Console có log gì?**
   - Nếu không thấy log: API không được gọi
   - Nếu thấy "not found": ExpertConfirmation không tồn tại với expertId/userId/chatId đó

3. **Database có record không?**
   - Chạy query kiểm tra xem có ExpertConfirmation với expertId/userId/chatId không

### Cách sửa:

1. **Nếu ExpertConfirmation không tồn tại:**
   - Tạo ExpertConfirmation mới trong database
   - Hoặc đảm bảo user đã tạo yêu cầu xác nhận trước

2. **Nếu API lỗi:**
   - Kiểm tra backend có chạy không
   - Kiểm tra token authentication
   - Kiểm tra role có đúng "Expert" không

## 📝 Checklist

- [ ] Frontend Console có log `📤 Sending confirmation`
- [ ] Frontend Console có log `✅ Confirmation response`
- [ ] Backend Console có log `Successfully saved to database`
- [ ] Database có record với `Status = 'Confirmed'`
- [ ] Database có `Message` = ghi chú bạn đã nhập
- [ ] Database có `UpdatedAt` > `CreatedAt`

