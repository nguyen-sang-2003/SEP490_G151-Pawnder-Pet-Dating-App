# Hướng dẫn kiểm tra Chat History trên Frontend

## Bước 1: Khởi động ứng dụng
1. Đảm bảo Backend đang chạy: `http://localhost:5297`
2. Đảm bảo Frontend Admin đang chạy: `http://localhost:3000`

## Bước 2: Đăng nhập
1. Mở Admin Panel: http://localhost:3000
2. Đăng nhập với tài khoản **Expert** hoặc **Admin**
   - Email: `expert@pawnder.com` (hoặc admin account)
   - Password: (mật khẩu của bạn)

## Bước 3: Kiểm tra Expert Notifications
1. Vào menu **"Quản lý thông báo"** hoặc **"Expert Notifications"**
2. Tìm notification có:
   - **Người dùng**: user1 (Lê Minh C)
   - **Tiêu đề**: Chat #1 (hoặc "Tư vấn giống chó phù hợp")
   - **Trạng thái**: Pending hoặc Confirmed

## Bước 4: Xem chi tiết chat
1. Click vào button **"Xác nhận"** hoặc **"Xem"** (icon mắt)
2. Modal sẽ hiển thị:
   - Thông tin thông báo
   - **File đoạn chat** section
   - Click vào card **"chat_1.txt"** (hoặc chat_{ChatAIId}.txt)
3. Kiểm tra:
   - ✅ Số tin nhắn hiển thị: **"6 tin nhắn"** (thay vì 2)
   - ✅ Click "Xem file" để mở rộng
   - ✅ Xem danh sách tin nhắn:
     - Tin nhắn 1: User hỏi về chó hiền
     - Tin nhắn 2: AI trả lời về Golden Retriever
     - Tin nhắn 3: User hỏi về không gian
     - Tin nhắn 4: AI trả lời về không gian
     - Tin nhắn 5: User hỏi về giống khác
     - Tin nhắn 6: AI trả lời về các giống nhỏ
     - ... (tổng cộng 6 cặp Q&A = 12 tin nhắn hiển thị)

## Bước 5: Kiểm tra Console (nếu có lỗi)
1. Mở Developer Tools (F12)
2. Vào tab **Console**
3. Kiểm tra:
   - ✅ Không có lỗi 404 hoặc 500
   - ✅ Có log: `getChatHistory(1) success` (nếu có)
   - ❌ Nếu có lỗi: Xem error message

## Kết quả mong đợi:
- ✅ File chat hiển thị: **"6 tin nhắn"** (hoặc 12 tin nhắn nếu đếm cả Q&A)
- ✅ Khi mở rộng, thấy đầy đủ 6 cặp câu hỏi-trả lời
- ✅ Tin nhắn được sắp xếp theo thứ tự thời gian
- ✅ Mỗi tin nhắn có role: "user" hoặc "ai"

## Nếu không thấy đúng:
1. **Kiểm tra database**: Chạy `database/check_chat_history.sql`
2. **Kiểm tra API**: Xem `FE/fe-admin/TEST_CHAT_API.md`
3. **Kiểm tra Network tab**: Xem request `/api/chat-ai/{chatAiId}/messages` có thành công không
4. **Kiểm tra Console**: Xem có lỗi JavaScript không

