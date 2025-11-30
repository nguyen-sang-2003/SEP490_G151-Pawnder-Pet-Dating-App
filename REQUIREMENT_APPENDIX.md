# Requirement Appendix - Pawnder Pet Dating App

## 5.1 Business Rules

| ID | Rule Definition |
|----|----------------|
| BR-01 | Users must be at least 18 years old to register and use the application. |
| BR-02 | Each user can register a maximum of 5 pets in their profile. |
| BR-03 | Pet photos must be verified by the system before being displayed in the dating feed. |
| BR-04 | Users can only send messages to matched pets (mutual likes). |
| BR-05 | All financial transactions must be processed through secure payment gateways with 256-bit encryption. |
| BR-06 | Expert confirmations must be completed within 24 hours of user request, otherwise the request expires. |
| BR-07 | Users can report inappropriate content or behavior, and reports must be reviewed within 48 hours. |
| BR-08 | Banned users cannot access the application or send messages until the ban period expires. |
| BR-09 | AI chat responses must be verified by an expert before being sent to users when requested. |
| BR-10 | Expert accounts must be approved by administrators before they can provide consultation services. |
| BR-11 | Chat messages between users and experts are stored for quality assurance and dispute resolution. |
| BR-12 | Pet matching algorithm considers user preferences, pet characteristics, and location proximity. |
| BR-13 | All user data and pet information must comply with GDPR and local data protection regulations. |
| BR-14 | Payment history is maintained for a minimum of 2 years for accounting and audit purposes. |
| BR-15 | Expert notifications for AI verification must be prioritized and displayed prominently. |
| BR-16 | Pet profiles must include at least one photo and basic information (name, age, breed) before being active. |
| BR-17 | Only administrators can ban users, and ban duration must be specified (temporary or permanent). |
| BR-18 | User reports are automatically escalated if multiple reports are received for the same user within 7 days. |
| BR-19 | Expert confirmations create notifications for users when status changes to "confirmed". |
| BR-20 | Chat history with AI is preserved when users request expert verification. |
| BR-21 | Payment transactions must be confirmed within 5 minutes or automatically cancelled. |
| BR-22 | Expert accounts require email verification and background check approval before activation. |
| BR-23 | All image uploads must be validated for file type (JPG, PNG) and size (max 10MB per image). |
| BR-24 | Daily limits are enforced for certain operations to prevent abuse (e.g., chat messages, API calls). |
| BR-25 | Pet recommendations are generated based on user preferences and pet characteristics. |
| BR-26 | Pet image analysis uses AI to extract characteristics and provide insights. |
| BR-27 | User preferences are stored and used to personalize the matching experience. |
| BR-28 | Blocked users cannot see or interact with each other in the application. |
| BR-29 | Attributes and attribute options are used to categorize and filter pets. |
| BR-30 | Address information is required for location-based matching and services. |

## 5.2 Common Requirements

### 5.2.1 Authentication & Authorization
- All API endpoints require JWT token authentication except login and registration.
- Token expiration time is 24 hours, with refresh token valid for 7 days.
- Role-based access control: Admin, Expert, and User roles with different permission levels.
- Password must be at least 8 characters, containing uppercase, lowercase, numbers, and special characters.
- Failed login attempts are limited to 5 times per hour per IP address.

### 5.2.2 Data Validation
- All user inputs must be validated on both client and server side.
- Email addresses must follow RFC 5322 standard format.
- Phone numbers must be in international format (E.164).
- Date fields must be in ISO 8601 format (YYYY-MM-DD).
- Numeric fields must be validated for range and type.

### 5.2.3 Image Handling
- All images are uploaded to Cloudinary cloud storage.
- Maximum image dimensions: 2000x2000 pixels.
- Supported formats: JPEG, PNG, WebP.
- Images are automatically optimized and resized for different use cases.
- Avatar images are cropped to circular format (1:1 aspect ratio).

### 5.2.4 Real-time Communication
- SignalR is used for real-time chat messaging between users and experts.
- Messages are delivered with delivery confirmation.
- Connection state is monitored and automatically reconnected on failure.
- Message history is loaded when chat is opened.

### 5.2.5 Error Handling
- All errors must be logged with timestamp, user ID, and error details.
- User-facing error messages must be clear and actionable.
- System errors must not expose sensitive information (database structure, API keys, etc.).
- Network errors must provide retry mechanisms with exponential backoff.

### 5.2.6 Performance Requirements
- Page load time must be under 2 seconds for 95% of requests.
- API response time must be under 500ms for 90% of requests.
- Image loading must use lazy loading and progressive enhancement.
- Database queries must be optimized with proper indexing.

### 5.2.7 Security Requirements
- All API communications must use HTTPS (TLS 1.2 or higher).
- Sensitive data (passwords, payment info) must be encrypted at rest.
- SQL injection prevention through parameterized queries.
- XSS prevention through input sanitization and output encoding.
- CSRF protection for state-changing operations.

### 5.2.8 Accessibility Requirements
- Application must support screen readers (ARIA labels).
- Color contrast ratio must meet WCAG 2.1 AA standards.
- Keyboard navigation must be available for all interactive elements.
- Text must be resizable up to 200% without loss of functionality.

### 5.2.9 Localization
- Application supports Vietnamese (vi-VN) as primary language.
- Date and time formats follow Vietnamese locale standards.
- Currency is displayed in Vietnamese Dong (VND).
- All user-facing text must be translatable.

### 5.2.10 Data Privacy
- User data is only collected for application functionality.
- Users can request data export and deletion (GDPR compliance).
- Third-party services (Cloudinary, Google Gemini) must comply with data protection agreements.
- Analytics data is anonymized and aggregated.

## 5.3 Application Messages List

| # | Message Code | Message Type | Context | Content |
|---|--------------|--------------|---------|---------|
| 1 | MSG01 | In line | No search results found | Không tìm thấy kết quả nào. |
| 2 | MSG02 | In red, under text box | Required field is empty | Trường * là bắt buộc. |
| 3 | MSG03 | Toast message | Updating information successfully | Cập nhật thông tin thành công. |
| 4 | MSG04 | Toast message | Adding new item successfully | Thêm mới thành công. |
| 5 | MSG05 | Toast message | Email sent successfully | Email xác nhận đã được gửi đến {email_address}. |
| 6 | MSG06 | Toast message | Resetting information successfully | Đặt lại thông tin thành công. |
| 7 | MSG07 | Toast message | Deleting information successfully | Xóa thành công. |
| 8 | MSG08 | In red, under text box | Input value exceeds max length | Vượt quá độ dài tối đa {max_length} ký tự. |
| 9 | MSG09 | In line | Incorrect username or password | Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại. |
| 10 | MSG10 | Toast message | Login successfully | Đăng nhập thành công. |
| 11 | MSG11 | Toast message | Logout successfully | Đăng xuất thành công. |
| 12 | MSG12 | Toast message | Registration successfully | Đăng ký thành công. |
| 13 | MSG13 | Toast message | Password changed successfully | Đổi mật khẩu thành công. |
| 14 | MSG14 | Toast message | Profile updated successfully | Cập nhật hồ sơ thành công. |
| 15 | MSG15 | Toast message | Message sent successfully | Gửi tin nhắn thành công. |
| 16 | MSG16 | Toast message | Pet added successfully | Thêm thú cưng thành công. |
| 17 | MSG17 | Toast message | Pet updated successfully | Cập nhật thú cưng thành công. |
| 18 | MSG18 | Toast message | Pet deleted successfully | Xóa thú cưng thành công. |
| 19 | MSG19 | Toast message | Report submitted successfully | Gửi báo cáo thành công. |
| 20 | MSG20 | Toast message | Report processed successfully | Xử lý báo cáo thành công. |
| 21 | MSG21 | Toast message | User banned successfully | Cấm người dùng thành công. |
| 22 | MSG22 | Toast message | User unbanned successfully | Gỡ cấm người dùng thành công. |
| 23 | MSG23 | Toast message | Expert confirmation submitted successfully | Xác nhận chuyên gia thành công. |
| 24 | MSG24 | Toast message | Payment processed successfully | Thanh toán thành công. |
| 25 | MSG25 | In line | No internet connection | Không có kết nối internet. Vui lòng kiểm tra lại. |
| 26 | MSG26 | Toast message | Session expired, please login again | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. |
| 27 | MSG27 | Toast message | Unauthorized access | Bạn không có quyền truy cập tính năng này. |
| 28 | MSG28 | Toast message | Server error, please try again later | Lỗi máy chủ. Vui lòng thử lại sau. |
| 29 | MSG29 | In line | No data available | Không có dữ liệu. |
| 30 | MSG30 | Toast message | Image uploaded successfully | Tải ảnh lên thành công. |
| 31 | MSG31 | In red, under text box | Invalid email format | Định dạng email không hợp lệ. |
| 32 | MSG32 | In red, under text box | Invalid phone number format | Định dạng số điện thoại không hợp lệ. |
| 33 | MSG33 | In red, under text box | Password too weak | Mật khẩu quá yếu. Vui lòng sử dụng ít nhất 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt. |
| 34 | MSG34 | Toast message | Password reset email sent | Email đặt lại mật khẩu đã được gửi. |
| 35 | MSG35 | Toast message | Password reset successfully | Đặt lại mật khẩu thành công. |
| 36 | MSG36 | Toast message | Email verified successfully | Xác thực email thành công. |
| 37 | MSG37 | Toast message | Verification email sent | Email xác thực đã được gửi. |
| 38 | MSG38 | Toast message | Chat history loaded | Đã tải lịch sử chat. |
| 39 | MSG39 | Toast message | AI response generated | Câu trả lời AI đã được tạo. |
| 40 | MSG40 | Toast message | Expert notification created | Đã tạo thông báo cho chuyên gia. |
| 41 | MSG41 | Toast message | Expert response received | Đã nhận phản hồi từ chuyên gia. |
| 42 | MSG42 | In line | No notifications | Không có thông báo nào. |
| 43 | MSG43 | Toast message | Notification marked as read | Đã đánh dấu thông báo là đã đọc. |
| 44 | MSG44 | In line | Loading... | Đang tải... |
| 45 | MSG45 | Toast message | Operation cancelled | Đã hủy thao tác. |
| 46 | MSG46 | Toast message | Confirmation required | Vui lòng xác nhận thao tác này. |
| 47 | MSG47 | In red, under text box | File size too large | Kích thước file quá lớn. Tối đa {max_size}MB. |
| 48 | MSG48 | In red, under text box | Invalid file type | Loại file không hợp lệ. Chỉ chấp nhận {allowed_types}. |
| 49 | MSG49 | Toast message | File uploaded successfully | Tải file lên thành công. |
| 50 | MSG50 | Toast message | File deleted successfully | Xóa file thành công. |
| 51 | MSG51 | Toast message | Filter applied successfully | Đã áp dụng bộ lọc. |
| 52 | MSG52 | Toast message | Filter cleared | Đã xóa bộ lọc. |
| 53 | MSG53 | Toast message | Sort order changed | Đã thay đổi thứ tự sắp xếp. |
| 54 | MSG54 | Toast message | Pagination changed | Đã thay đổi trang. |
| 55 | MSG55 | In line | No items in this page | Không có mục nào trong trang này. |
| 56 | MSG56 | In line | Payment failed | Thanh toán thất bại. Vui lòng thử lại. |
| 57 | MSG57 | In line | Account is banned | Tài khoản của bạn đã bị cấm. Vui lòng liên hệ hỗ trợ. |
| 58 | MSG58 | Toast message | Expert created successfully | Tạo tài khoản chuyên gia thành công. |
| 59 | MSG59 | Toast message | Expert updated successfully | Cập nhật thông tin chuyên gia thành công. |
| 60 | MSG60 | Toast message | User updated successfully | Cập nhật thông tin người dùng thành công. |
| 61 | MSG61 | Toast message | Attribute added successfully | Thêm thuộc tính thành công. |
| 62 | MSG62 | Toast message | Attribute updated successfully | Cập nhật thuộc tính thành công. |
| 63 | MSG63 | Toast message | Attribute deleted successfully | Xóa thuộc tính thành công. |
| 64 | MSG64 | Toast message | Pet recommendation generated | Đã tạo gợi ý thú cưng. |
| 65 | MSG65 | Toast message | Pet image analyzed | Đã phân tích ảnh thú cưng. |
| 66 | MSG66 | Toast message | User preference saved | Đã lưu tùy chọn người dùng. |
| 67 | MSG67 | Toast message | User blocked successfully | Đã chặn người dùng. |
| 68 | MSG68 | Toast message | User unblocked successfully | Đã bỏ chặn người dùng. |
| 69 | MSG69 | Toast message | Daily limit reached | Đã đạt giới hạn hàng ngày. |
| 70 | MSG70 | Toast message | Address updated successfully | Đã cập nhật địa chỉ. |

---

**Note:** All messages are displayed in Vietnamese (vi-VN) as the primary language of the application. Message codes follow the format MSG## where ## is a two-digit number. Toast messages appear for 3-5 seconds and can be dismissed by user interaction. Inline messages persist until the condition changes or user action is taken.
