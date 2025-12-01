# Phụ lục Yêu cầu - Ứng dụng Hẹn hò Thú cưng Pawnder

## 5.1 Quy tắc Nghiệp vụ

| ID | Định nghĩa Quy tắc |
|----|-------------------|
| BR-01 | Người dùng phải đủ 18 tuổi trở lên để đăng ký và sử dụng ứng dụng. |
| BR-02 | Mỗi người dùng có thể đăng ký tối đa 5 thú cưng trong hồ sơ của họ. |
| BR-03 | Ảnh thú cưng phải được hệ thống xác minh trước khi hiển thị trong feed hẹn hò. |
| BR-04 | Người dùng chỉ có thể gửi tin nhắn cho các thú cưng đã ghép đôi (cả hai đều thích nhau). |
| BR-05 | Tất cả các giao dịch tài chính phải được xử lý qua các cổng thanh toán an toàn với mã hóa 256-bit. |
| BR-06 | Xác nhận của chuyên gia phải được hoàn thành trong vòng 24 giờ kể từ khi người dùng yêu cầu, nếu không yêu cầu sẽ hết hạn. |
| BR-07 | Người dùng có thể báo cáo nội dung hoặc hành vi không phù hợp, và các báo cáo phải được xem xét trong vòng 48 giờ. |
| BR-08 | Người dùng bị cấm không thể truy cập ứng dụng hoặc gửi tin nhắn cho đến khi thời hạn cấm hết hạn. |
| BR-09 | Phản hồi chat AI phải được chuyên gia xác minh trước khi gửi cho người dùng khi được yêu cầu. |
| BR-10 | Tài khoản chuyên gia phải được quản trị viên phê duyệt trước khi họ có thể cung cấp dịch vụ tư vấn. |
| BR-11 | Tin nhắn chat giữa người dùng và chuyên gia được lưu trữ để đảm bảo chất lượng và giải quyết tranh chấp. |
| BR-12 | Thuật toán ghép đôi thú cưng xem xét sở thích người dùng, đặc điểm thú cưng và khoảng cách địa lý. |
| BR-13 | Tất cả dữ liệu người dùng và thông tin thú cưng phải tuân thủ GDPR và các quy định bảo vệ dữ liệu địa phương. |
| BR-14 | Lịch sử thanh toán được lưu trữ tối thiểu 2 năm cho mục đích kế toán và kiểm toán. |
| BR-15 | Thông báo chuyên gia cho việc xác minh AI phải được ưu tiên và hiển thị nổi bật. |
| BR-16 | Hồ sơ thú cưng phải bao gồm ít nhất một ảnh và thông tin cơ bản (tên, tuổi, giống) trước khi được kích hoạt. |
| BR-17 | Chỉ quản trị viên mới có thể cấm người dùng, và thời hạn cấm phải được chỉ định (tạm thời hoặc vĩnh viễn). |
| BR-18 | Báo cáo người dùng được tự động nâng cấp nếu nhận được nhiều báo cáo cho cùng một người dùng trong vòng 7 ngày. |
| BR-19 | Xác nhận chuyên gia tạo thông báo cho người dùng khi trạng thái thay đổi thành "đã xác nhận". |
| BR-20 | Lịch sử chat với AI được bảo tồn khi người dùng yêu cầu xác minh chuyên gia. |
| BR-21 | Giao dịch thanh toán phải được xác nhận trong vòng 5 phút hoặc tự động hủy. |
| BR-22 | Tài khoản chuyên gia yêu cầu xác minh email và phê duyệt kiểm tra lý lịch trước khi kích hoạt. |
| BR-23 | Tất cả các tải ảnh lên phải được xác thực về loại file (JPG, PNG) và kích thước (tối đa 10MB mỗi ảnh). |
| BR-24 | Giới hạn hàng ngày được áp dụng cho một số thao tác để tránh lạm dụng (ví dụ: tin nhắn chat, API calls). |
| BR-25 | Gợi ý thú cưng được tạo dựa trên sở thích người dùng và đặc điểm thú cưng. |
| BR-26 | Phân tích ảnh thú cưng sử dụng AI để trích xuất đặc điểm và cung cấp thông tin chi tiết. |
| BR-27 | Tùy chọn người dùng được lưu trữ và sử dụng để cá nhân hóa trải nghiệm ghép đôi. |
| BR-28 | Người dùng bị chặn không thể thấy hoặc tương tác với nhau trong ứng dụng. |
| BR-29 | Thuộc tính và tùy chọn thuộc tính được sử dụng để phân loại và lọc thú cưng. |
| BR-30 | Thông tin địa chỉ là bắt buộc cho ghép đôi dựa trên vị trí và dịch vụ. |

## 5.2 Yêu cầu Chung

### 5.2.1 Xác thực & Phân quyền
- Tất cả các API endpoint yêu cầu xác thực JWT token ngoại trừ đăng nhập và đăng ký.
- Thời gian hết hạn token là 24 giờ, với refresh token hợp lệ trong 7 ngày.
- Kiểm soát truy cập dựa trên vai trò: Quản trị viên, Chuyên gia và Người dùng với các mức quyền khác nhau.
- Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
- Số lần đăng nhập thất bại bị giới hạn 5 lần mỗi giờ cho mỗi địa chỉ IP.

### 5.2.2 Xác thực Dữ liệu
- Tất cả đầu vào của người dùng phải được xác thực ở cả phía client và server.
- Địa chỉ email phải tuân theo định dạng chuẩn RFC 5322.
- Số điện thoại phải ở định dạng quốc tế (E.164).
- Các trường ngày tháng phải ở định dạng ISO 8601 (YYYY-MM-DD).
- Các trường số phải được xác thực về phạm vi và loại.

### 5.2.3 Xử lý Hình ảnh
- Tất cả hình ảnh được tải lên Cloudinary cloud storage.
- Kích thước hình ảnh tối đa: 2000x2000 pixel.
- Định dạng được hỗ trợ: JPEG, PNG, WebP.
- Hình ảnh được tự động tối ưu hóa và thay đổi kích thước cho các trường hợp sử dụng khác nhau.
- Ảnh đại diện được cắt thành định dạng tròn (tỷ lệ khung hình 1:1).

### 5.2.4 Giao tiếp Thời gian Thực
- SignalR được sử dụng cho tin nhắn chat thời gian thực giữa người dùng và chuyên gia.
- Tin nhắn được gửi kèm xác nhận giao hàng.
- Trạng thái kết nối được theo dõi và tự động kết nối lại khi thất bại.
- Lịch sử tin nhắn được tải khi mở chat.

### 5.2.5 Xử lý Lỗi
- Tất cả lỗi phải được ghi log với timestamp, ID người dùng và chi tiết lỗi.
- Thông báo lỗi cho người dùng phải rõ ràng và có thể thực hiện được.
- Lỗi hệ thống không được tiết lộ thông tin nhạy cảm (cấu trúc cơ sở dữ liệu, API keys, v.v.).
- Lỗi mạng phải cung cấp cơ chế thử lại với exponential backoff.

### 5.2.6 Yêu cầu Hiệu suất
- Thời gian tải trang phải dưới 2 giây cho 95% các yêu cầu.
- Thời gian phản hồi API phải dưới 500ms cho 90% các yêu cầu.
- Tải hình ảnh phải sử dụng lazy loading và progressive enhancement.
- Truy vấn cơ sở dữ liệu phải được tối ưu hóa với chỉ mục phù hợp.

### 5.2.7 Yêu cầu Bảo mật
- Tất cả giao tiếp API phải sử dụng HTTPS (TLS 1.2 trở lên).
- Dữ liệu nhạy cảm (mật khẩu, thông tin thanh toán) phải được mã hóa khi lưu trữ.
- Ngăn chặn SQL injection thông qua truy vấn tham số hóa.
- Ngăn chặn XSS thông qua sanitization đầu vào và mã hóa đầu ra.
- Bảo vệ CSRF cho các thao tác thay đổi trạng thái.

### 5.2.8 Yêu cầu Khả năng Truy cập
- Ứng dụng phải hỗ trợ trình đọc màn hình (nhãn ARIA).
- Tỷ lệ tương phản màu phải đáp ứng tiêu chuẩn WCAG 2.1 AA.
- Điều hướng bàn phím phải có sẵn cho tất cả các phần tử tương tác.
- Văn bản phải có thể thay đổi kích thước lên đến 200% mà không mất chức năng.

### 5.2.9 Bản địa hóa
- Ứng dụng hỗ trợ tiếng Việt (vi-VN) làm ngôn ngữ chính.
- Định dạng ngày và giờ tuân theo tiêu chuẩn địa phương Việt Nam.
- Tiền tệ được hiển thị bằng Đồng Việt Nam (VND).
- Tất cả văn bản hướng đến người dùng phải có thể dịch được.

### 5.2.10 Quyền riêng tư Dữ liệu
- Dữ liệu người dùng chỉ được thu thập cho chức năng ứng dụng.
- Người dùng có thể yêu cầu xuất và xóa dữ liệu (tuân thủ GDPR).
- Các dịch vụ bên thứ ba (Cloudinary, Google Gemini) phải tuân thủ các thỏa thuận bảo vệ dữ liệu.
- Dữ liệu phân tích được ẩn danh và tổng hợp.

## 5.3 Danh sách Thông báo Ứng dụng

Bảng sau chỉ liệt kê các thông báo đang tồn tại trong mã nguồn (React fe-admin và React Native FE-User) kèm vị trí sử dụng để tiện truy vết.

| # | Mã Thông báo | Loại Thông báo | Ngữ cảnh (file / màn) | Nội dung |
|---|--------------|----------------|-----------------------|----------|
| 1 | MSG01 | Hộp thoại cảnh báo | `fe-admin/src/features/users/UsersList.js` – Modal ban | `Vui lòng nhập lý do ban!` |
| 2 | MSG02 | Hộp thoại cảnh báo | `fe-admin/src/features/users/UsersList.js` – Modal ban | `Đã ban người dùng thành công!` |
| 3 | MSG03 | Hộp thoại cảnh báo | `fe-admin/src/features/users/UsersList.js` – Modal ban | `Không thể ban người dùng. Vui lòng thử lại sau.` |
| 4 | MSG04 | Hộp thoại cảnh báo | `fe-admin/src/features/users/UsersList.js` – Modal ban | `Đã gỡ ban người dùng thành công!` |
| 5 | MSG05 | Hộp thoại cảnh báo | `fe-admin/src/features/users/UsersList.js` – Modal ban | `Không thể gỡ ban người dùng. Vui lòng thử lại sau.` |
| 6 | MSG06 | Hộp thoại cảnh báo | `fe-admin/src/features/experts/ExpertNotifications.js` – Form xác nhận | `Vui lòng nhập ghi chú trước khi xác nhận.` |
| 7 | MSG07 | Hộp thoại cảnh báo | `fe-admin/src/features/experts/ExpertNotifications.js` – Form xác nhận | `Không thể xác định chuyên gia. Vui lòng đăng nhập lại.` |
| 8 | MSG08 | Hộp thoại cảnh báo | `fe-admin/src/features/experts/ExpertNotifications.js` – Form xác nhận | `Đã xác nhận thông báo thành công.` |
| 9 | MSG09 | Hộp thoại cảnh báo | `fe-admin/src/features/experts/ExpertNotifications.js` – Form xác nhận | `Không thể xác nhận thông báo. Vui lòng thử lại.` |
| 10 | MSG10 | Hộp thoại cảnh báo | `fe-admin/src/features/experts/ExpertChat.js` – Chat chuyên gia | `Không thể gửi tin nhắn. Vui lòng đăng nhập lại.` |
| 11 | MSG11 | Hộp thoại cảnh báo | `fe-admin/src/features/experts/ExpertChat.js` – Chat chuyên gia | `Không thể gửi tin nhắn. Vui lòng thử lại.` |
| 12 | MSG12 | Thông báo inline | `fe-admin/src/features/experts/ExpertChat.js`, `fe-admin/src/features/experts/ExpertNotifications.js` | `Đang tải...` / `Đang tải dữ liệu...` |
| 13 | MSG13 | Thông báo inline | `FE-User/src/features/payment/screens/QRPaymentScreen.tsx` | `Không thể tạo mã QR. Vui lòng thử lại.` |
| 14 | MSG14 | `Alert.alert` | `QRPaymentScreen.tsx` – Thanh toán | `Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.` |
| 15 | MSG15 | `Alert.alert` | `QRPaymentScreen.tsx` – Thanh toán | `Thông tin người dùng không hợp lệ.` |
| 16 | MSG16 | `Alert.alert` | `QRPaymentScreen.tsx` – Thanh toán thành công | `🎉 Thanh toán thành công! Bạn đã nâng cấp lên {planName}! …` |
| 17 | MSG17 | `Alert.alert` | `QRPaymentScreen.tsx` – Thanh toán | `Không thể hoàn tất thanh toán. Vui lòng thử lại.` |
| 18 | MSG18 | `Alert.alert` | `QRPaymentScreen.tsx` – Thanh toán | `Lỗi thanh toán – Đã có lỗi xảy ra. Vui lòng thử lại sau.` |
| 19 | MSG19 | `Alert.alert` | `FE-User/src/features/home/screens/FilterScreen.tsx` | `Failed to Save – Unknown error. Please try again.` |
| 20 | MSG20 | `Alert.alert` | `FE-User/src/features/expert/screens/ExpertChatScreen.tsx` | `Không tìm thấy cuộc trò chuyện.` |
| 21 | MSG21 | `Alert.alert` | `ExpertChatScreen.tsx` | `Không thể tải tin nhắn.` |
| 22 | MSG22 | `Alert.alert` | `ExpertChatScreen.tsx`, `FE-User/src/features/chat/screens/AIChatScreen.tsx` | `Không thể gửi tin nhắn. Vui lòng thử lại.` |
| 23 | MSG23 | `Alert.alert` | `AIChatScreen.tsx` | `Không thể tải lịch sử chat.` |
| 24 | MSG24 | `Alert.alert` | `AIChatScreen.tsx` | `Vui lòng tạo cuộc trò chuyện mới trước.` |
| 25 | MSG25 | `Alert.alert` | `AIChatScreen.tsx` | `AI đang quá tải – AI đang mất nhiều thời gian để xử lý. Vui lòng thử lại sau vài giây.` |
| 26 | MSG26 | `Alert.alert` | `AIChatScreen.tsx` | `Có lỗi xảy ra với AI. Vui lòng thử lại.` |
| 27 | MSG27 | `Alert.alert` | `AIChatScreen.tsx` | `Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.` |
| 28 | MSG28 | `CustomAlert` | `AIChatScreen.tsx` – Modal gửi chuyên gia | `Vui lòng nhập câu hỏi của bạn.` |
| 29 | MSG29 | `CustomAlert` | `AIChatScreen.tsx` – Modal gửi chuyên gia | `Vui lòng lưu cuộc trò chuyện trước khi yêu cầu chuyên gia.` |
| 30 | MSG30 | `CustomAlert` | `AIChatScreen.tsx` – Modal gửi chuyên gia | `Không thể gửi yêu cầu. Vui lòng thử lại.` |
| 31 | MSG31 | Modal giới hạn | `AIChatScreen.tsx` – Giới hạn xác nhận chuyên gia | `Bạn đã hết lượt xác nhận chuyên gia hôm nay!` |
| 32 | MSG32 | `CustomAlert` | `AIChatScreen.tsx` – Thông báo thành công | `Đã gửi yêu cầu! Yêu cầu của bạn đã được gửi đến chuyên gia…` |
| 33 | MSG33 | `Alert.alert` | `FE-User/src/features/chat/screens/AIChatListScreen.tsx` | `Không thể tạo chat. Vui lòng thử lại sau.` |
| 34 | MSG34 | `Alert.alert` | `AIChatListScreen.tsx` | `Không thể đổi tên cuộc trò chuyện.` |
| 35 | MSG35 | Hộp thoại xác nhận | `AIChatListScreen.tsx` | `Delete Conversation – Delete "<title>"? This cannot be undone.` |
| 36 | MSG36 | `Alert.alert` | `AIChatListScreen.tsx` | `Không thể xóa cuộc trò chuyện.` |
| 37 | MSG37 | Thông báo lỗi inline | `fe-admin/src/features/auth/Login.js` – ô Email | `Email là bắt buộc.` |
| 38 | MSG38 | Thông báo lỗi inline | `fe-admin/src/features/auth/Login.js` – ô Email | `Email không hợp lệ.` |
| 39 | MSG39 | Thông báo lỗi inline | `fe-admin/src/features/auth/Login.js` – ô Mật khẩu | `Mật khẩu là bắt buộc.` |
| 40 | MSG40 | Thông báo lỗi inline | `fe-admin/src/features/auth/Login.js` – ô Mật khẩu | `Mật khẩu phải có ít nhất 6 ký tự.` |
| 41 | MSG41 | Thông báo lỗi chung | `fe-admin/src/features/auth/Login.js` – banner | `Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.` |
| 42 | MSG42 | `Alert.alert` | `FE-User/src/features/expert/screens/ExpertChatScreen.tsx` | `Không tìm thấy thông tin người dùng.` |
| 43 | MSG43 | `Alert.alert` | `FE-User/src/features/chat/screens/AIChatListScreen.tsx` | `Không tìm thấy thông tin người dùng.` |

---

**Lưu ý:** Mã MSG## chỉ phục vụ tài liệu, không phải mã trong code. Các thông điệp trên đều xuất hiện nguyên văn tại vị trí đã nêu.
