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

| # | Mã Thông báo | Loại Thông báo | Ngữ cảnh | Nội dung |
|---|--------------|----------------|----------|----------|
| 1 | MSG01 | Trong dòng | Không tìm thấy kết quả tìm kiếm | Không tìm thấy kết quả nào. |
| 2 | MSG02 | Màu đỏ, dưới ô văn bản | Trường bắt buộc trống | Trường * là bắt buộc. |
| 3 | MSG03 | Thông báo Toast | Cập nhật thông tin thành công | Cập nhật thông tin thành công. |
| 4 | MSG04 | Thông báo Toast | Thêm mới thành công | Thêm mới thành công. |
| 5 | MSG05 | Thông báo Toast | Email xác nhận đã được gửi thành công | Email xác nhận đã được gửi đến {email_address}. |
| 6 | MSG06 | Thông báo Toast | Đặt lại thông tin thành công | Đặt lại thông tin thành công. |
| 7 | MSG07 | Thông báo Toast | Xóa thông tin thành công | Xóa thành công. |
| 8 | MSG08 | Màu đỏ, dưới ô văn bản | Giá trị đầu vào vượt quá độ dài tối đa | Vượt quá độ dài tối đa {max_length} ký tự. |
| 9 | MSG09 | Trong dòng | Tên đăng nhập hoặc mật khẩu không đúng khi nhấp đăng nhập | Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại. |
| 10 | MSG10 | Thông báo Toast | Đăng nhập thành công | Đăng nhập thành công. |
| 11 | MSG11 | Thông báo Toast | Đăng xuất thành công | Đăng xuất thành công. |
| 12 | MSG12 | Thông báo Toast | Đăng ký thành công | Đăng ký thành công. |
| 13 | MSG13 | Thông báo Toast | Đổi mật khẩu thành công | Đổi mật khẩu thành công. |
| 14 | MSG14 | Thông báo Toast | Cập nhật hồ sơ thành công | Cập nhật hồ sơ thành công. |
| 15 | MSG15 | Thông báo Toast | Gửi tin nhắn thành công | Gửi tin nhắn thành công. |
| 16 | MSG16 | Thông báo Toast | Thêm thú cưng thành công | Thêm thú cưng thành công. |
| 17 | MSG17 | Thông báo Toast | Cập nhật thú cưng thành công | Cập nhật thú cưng thành công. |
| 18 | MSG18 | Thông báo Toast | Xóa thú cưng thành công | Xóa thú cưng thành công. |
| 19 | MSG19 | Thông báo Toast | Gửi báo cáo thành công | Gửi báo cáo thành công. |
| 20 | MSG20 | Thông báo Toast | Xử lý báo cáo thành công | Xử lý báo cáo thành công. |
| 21 | MSG21 | Thông báo Toast | Cấm người dùng thành công | Cấm người dùng thành công. |
| 22 | MSG22 | Thông báo Toast | Gỡ cấm người dùng thành công | Gỡ cấm người dùng thành công. |
| 23 | MSG23 | Thông báo Toast | Xác nhận chuyên gia thành công | Xác nhận chuyên gia thành công. |
| 24 | MSG24 | Thông báo Toast | Thanh toán thành công | Thanh toán thành công. |
| 25 | MSG25 | Trong dòng | Không có kết nối internet | Không có kết nối internet. Vui lòng kiểm tra lại. |
| 26 | MSG26 | Thông báo Toast | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. |
| 27 | MSG27 | Thông báo Toast | Truy cập trái phép | Bạn không có quyền truy cập tính năng này. |
| 28 | MSG28 | Thông báo Toast | Lỗi máy chủ, vui lòng thử lại sau | Lỗi máy chủ. Vui lòng thử lại sau. |
| 29 | MSG29 | Trong dòng | Không có dữ liệu | Không có dữ liệu. |
| 30 | MSG30 | Thông báo Toast | Tải ảnh lên thành công | Tải ảnh lên thành công. |
| 31 | MSG31 | Màu đỏ, dưới ô văn bản | Định dạng email không hợp lệ | Định dạng email không hợp lệ. |
| 32 | MSG32 | Màu đỏ, dưới ô văn bản | Định dạng số điện thoại không hợp lệ | Định dạng số điện thoại không hợp lệ. |
| 33 | MSG33 | Màu đỏ, dưới ô văn bản | Mật khẩu quá yếu | Mật khẩu quá yếu. Vui lòng sử dụng ít nhất 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt. |
| 34 | MSG34 | Thông báo Toast | Email đặt lại mật khẩu đã được gửi | Email đặt lại mật khẩu đã được gửi. |
| 35 | MSG35 | Thông báo Toast | Đặt lại mật khẩu thành công | Đặt lại mật khẩu thành công. |
| 36 | MSG36 | Thông báo Toast | Xác thực email thành công | Xác thực email thành công. |
| 37 | MSG37 | Thông báo Toast | Email xác thực đã được gửi | Email xác thực đã được gửi. |
| 38 | MSG38 | Thông báo Toast | Đã tải lịch sử chat | Đã tải lịch sử chat. |
| 39 | MSG39 | Thông báo Toast | Câu trả lời AI đã được tạo | Câu trả lời AI đã được tạo. |
| 40 | MSG40 | Thông báo Toast | Đã tạo thông báo cho chuyên gia | Đã tạo thông báo cho chuyên gia. |
| 41 | MSG41 | Thông báo Toast | Đã nhận phản hồi từ chuyên gia | Đã nhận phản hồi từ chuyên gia. |
| 42 | MSG42 | Trong dòng | Không có thông báo | Không có thông báo nào. |
| 43 | MSG43 | Thông báo Toast | Đã đánh dấu thông báo là đã đọc | Đã đánh dấu thông báo là đã đọc. |
| 44 | MSG44 | Trong dòng | Đang tải... | Đang tải... |
| 45 | MSG45 | Thông báo Toast | Đã hủy thao tác | Đã hủy thao tác. |
| 46 | MSG46 | Thông báo Toast | Yêu cầu xác nhận | Vui lòng xác nhận thao tác này. |
| 47 | MSG47 | Màu đỏ, dưới ô văn bản | Kích thước file quá lớn | Kích thước file quá lớn. Tối đa {max_size}MB. |
| 48 | MSG48 | Màu đỏ, dưới ô văn bản | Loại file không hợp lệ | Loại file không hợp lệ. Chỉ chấp nhận {allowed_types}. |
| 49 | MSG49 | Thông báo Toast | Tải file lên thành công | Tải file lên thành công. |
| 50 | MSG50 | Thông báo Toast | Xóa file thành công | Xóa file thành công. |
| 51 | MSG51 | Thông báo Toast | Đã áp dụng bộ lọc | Đã áp dụng bộ lọc. |
| 52 | MSG52 | Thông báo Toast | Đã xóa bộ lọc | Đã xóa bộ lọc. |
| 53 | MSG53 | Thông báo Toast | Đã thay đổi thứ tự sắp xếp | Đã thay đổi thứ tự sắp xếp. |
| 54 | MSG54 | Thông báo Toast | Đã thay đổi trang | Đã thay đổi trang. |
| 55 | MSG55 | Trong dòng | Không có mục nào trong trang này | Không có mục nào trong trang này. |
| 56 | MSG56 | Trong dòng | Thanh toán thất bại | Thanh toán thất bại. Vui lòng thử lại. |
| 57 | MSG57 | Trong dòng | Tài khoản bị cấm | Tài khoản của bạn đã bị cấm. Vui lòng liên hệ hỗ trợ. |
| 58 | MSG58 | Thông báo Toast | Tạo tài khoản chuyên gia thành công | Tạo tài khoản chuyên gia thành công. |
| 59 | MSG59 | Thông báo Toast | Cập nhật thông tin chuyên gia thành công | Cập nhật thông tin chuyên gia thành công. |
| 60 | MSG60 | Thông báo Toast | Cập nhật thông tin người dùng thành công | Cập nhật thông tin người dùng thành công. |
| 61 | MSG61 | Thông báo Toast | Thêm thuộc tính thành công | Thêm thuộc tính thành công. |
| 62 | MSG62 | Thông báo Toast | Cập nhật thuộc tính thành công | Cập nhật thuộc tính thành công. |
| 63 | MSG63 | Thông báo Toast | Xóa thuộc tính thành công | Xóa thuộc tính thành công. |
| 64 | MSG64 | Thông báo Toast | Đã tạo gợi ý thú cưng | Đã tạo gợi ý thú cưng. |
| 65 | MSG65 | Thông báo Toast | Đã phân tích ảnh thú cưng | Đã phân tích ảnh thú cưng. |
| 66 | MSG66 | Thông báo Toast | Đã lưu tùy chọn người dùng | Đã lưu tùy chọn người dùng. |
| 67 | MSG67 | Thông báo Toast | Đã chặn người dùng | Đã chặn người dùng. |
| 68 | MSG68 | Thông báo Toast | Đã bỏ chặn người dùng | Đã bỏ chặn người dùng. |
| 69 | MSG69 | Thông báo Toast | Đã đạt giới hạn hàng ngày | Đã đạt giới hạn hàng ngày. |
| 70 | MSG70 | Thông báo Toast | Đã cập nhật địa chỉ | Đã cập nhật địa chỉ. |

---

**Lưu ý:** Tất cả thông báo được hiển thị bằng tiếng Việt (vi-VN) làm ngôn ngữ chính của ứng dụng. Mã thông báo theo định dạng MSG## trong đó ## là số có hai chữ số. Thông báo Toast xuất hiện trong 3-5 giây và có thể bị hủy bởi tương tác của người dùng. Thông báo trong dòng tồn tại cho đến khi điều kiện thay đổi hoặc người dùng thực hiện hành động.
