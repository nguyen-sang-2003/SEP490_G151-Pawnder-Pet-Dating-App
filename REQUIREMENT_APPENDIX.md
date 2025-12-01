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

The table below lists every system message that currently appears in the source code (React fe-admin + React Native FE-User). Each entry includes the actual component where it is rendered, so reviewers can trace the implementation quickly.

| # | Message Code | Message Type | Context (file / feature) | Content |
|---|--------------|--------------|--------------------------|---------|
| 1 | MSG01 | Alert dialog | `fe-admin/src/features/users/UsersList.js` – Ban modal | `Vui lòng nhập lý do ban!` |
| 2 | MSG02 | Alert dialog | `fe-admin/src/features/users/UsersList.js` – Ban modal | `Đã ban người dùng thành công!` |
| 3 | MSG03 | Alert dialog | `fe-admin/src/features/users/UsersList.js` – Ban modal | `Không thể ban người dùng. Vui lòng thử lại sau.` |
| 4 | MSG04 | Alert dialog | `fe-admin/src/features/users/UsersList.js` – Ban modal | `Đã gỡ ban người dùng thành công!` |
| 5 | MSG05 | Alert dialog | `fe-admin/src/features/users/UsersList.js` – Ban modal | `Không thể gỡ ban người dùng. Vui lòng thử lại sau.` |
| 6 | MSG06 | Alert dialog | `fe-admin/src/features/experts/ExpertNotifications.js` – Confirmation form | `Vui lòng nhập ghi chú trước khi xác nhận.` |
| 7 | MSG07 | Alert dialog | `fe-admin/src/features/experts/ExpertNotifications.js` – Confirmation form | `Không thể xác định chuyên gia. Vui lòng đăng nhập lại.` |
| 8 | MSG08 | Alert dialog | `fe-admin/src/features/experts/ExpertNotifications.js` – Confirmation form | `Đã xác nhận thông báo thành công.` |
| 9 | MSG09 | Alert dialog | `fe-admin/src/features/experts/ExpertNotifications.js` – Confirmation form | `Không thể xác nhận thông báo. Vui lòng thử lại.` |
| 10 | MSG10 | Alert dialog | `fe-admin/src/features/experts/ExpertChat.js` – Expert chat | `Không thể gửi tin nhắn. Vui lòng đăng nhập lại.` |
| 11 | MSG11 | Alert dialog | `fe-admin/src/features/experts/ExpertChat.js` – Expert chat | `Không thể gửi tin nhắn. Vui lòng thử lại.` |
| 12 | MSG12 | Inline loading text | `fe-admin/src/features/experts/ExpertChat.js`, `fe-admin/src/features/experts/ExpertNotifications.js` | `Đang tải...` / `Đang tải dữ liệu...` |
| 13 | MSG13 | Inline error state | `FE-User/src/features/payment/screens/QRPaymentScreen.tsx` | `Không thể tạo mã QR. Vui lòng thử lại.` |
| 14 | MSG14 | Alert dialog | `QRPaymentScreen.tsx` – Checkout | `Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.` |
| 15 | MSG15 | Alert dialog | `QRPaymentScreen.tsx` – Checkout | `Thông tin người dùng không hợp lệ.` |
| 16 | MSG16 | Alert dialog | `QRPaymentScreen.tsx` – Checkout success | `🎉 Thanh toán thành công! Bạn đã nâng cấp lên {planName}! …` |
| 17 | MSG17 | Alert dialog | `QRPaymentScreen.tsx` – Checkout | `Không thể hoàn tất thanh toán. Vui lòng thử lại.` |
| 18 | MSG18 | Alert dialog | `QRPaymentScreen.tsx` – Checkout | `Lỗi thanh toán – Đã có lỗi xảy ra. Vui lòng thử lại sau.` |
| 19 | MSG19 | Alert dialog | `FE-User/src/features/home/screens/FilterScreen.tsx` | `Failed to Save – Unknown error. Please try again.` |
| 20 | MSG20 | Alert dialog | `FE-User/src/features/expert/screens/ExpertChatScreen.tsx` | `Không tìm thấy cuộc trò chuyện.` |
| 21 | MSG21 | Alert dialog | `ExpertChatScreen.tsx` | `Không thể tải tin nhắn.` |
| 22 | MSG22 | Alert dialog | `ExpertChatScreen.tsx`, `FE-User/src/features/chat/screens/AIChatScreen.tsx` | `Không thể gửi tin nhắn. Vui lòng thử lại.` |
| 23 | MSG23 | Alert dialog | `AIChatScreen.tsx` | `Không thể tải lịch sử chat.` |
| 24 | MSG24 | Alert dialog | `AIChatScreen.tsx` | `Vui lòng tạo cuộc trò chuyện mới trước.` |
| 25 | MSG25 | Alert dialog | `AIChatScreen.tsx` | `AI đang quá tải – AI đang mất nhiều thời gian để xử lý. Vui lòng thử lại sau vài giây.` |
| 26 | MSG26 | Alert dialog | `AIChatScreen.tsx` | `Có lỗi xảy ra với AI. Vui lòng thử lại.` |
| 27 | MSG27 | Alert dialog | `AIChatScreen.tsx` | `Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.` |
| 28 | MSG28 | Custom alert modal | `AIChatScreen.tsx` – Expert confirmation modal | `Vui lòng nhập câu hỏi của bạn.` |
| 29 | MSG29 | Custom alert modal | `AIChatScreen.tsx` – Expert confirmation modal | `Vui lòng lưu cuộc trò chuyện trước khi yêu cầu chuyên gia.` |
| 30 | MSG30 | Custom alert modal | `AIChatScreen.tsx` – Expert confirmation modal | `Không thể gửi yêu cầu. Vui lòng thử lại.` |
| 31 | MSG31 | Limit modal | `AIChatScreen.tsx` – Expert confirmation quota | `Bạn đã hết lượt xác nhận chuyên gia hôm nay!` |
| 32 | MSG32 | Custom alert modal | `AIChatScreen.tsx` – Success state | `Đã gửi yêu cầu! Yêu cầu của bạn đã được gửi đến chuyên gia…` |
| 33 | MSG33 | Alert dialog | `FE-User/src/features/chat/screens/AIChatListScreen.tsx` | `Không thể tạo chat. Vui lòng thử lại sau.` |
| 34 | MSG34 | Alert dialog | `AIChatListScreen.tsx` | `Không thể đổi tên cuộc trò chuyện.` |
| 35 | MSG35 | Confirmation dialog | `AIChatListScreen.tsx` | `Delete Conversation – Delete "<title>"? This cannot be undone.` |
| 36 | MSG36 | Alert dialog | `AIChatListScreen.tsx` | `Không thể xóa cuộc trò chuyện.` |
| 37 | MSG37 | Inline validation text | `fe-admin/src/features/auth/Login.js` – Email input | `Email là bắt buộc.` |
| 38 | MSG38 | Inline validation text | `fe-admin/src/features/auth/Login.js` – Email input | `Email không hợp lệ.` |
| 39 | MSG39 | Inline validation text | `fe-admin/src/features/auth/Login.js` – Password input | `Mật khẩu là bắt buộc.` |
| 40 | MSG40 | Inline validation text | `fe-admin/src/features/auth/Login.js` – Password input | `Mật khẩu phải có ít nhất 6 ký tự.` |
| 41 | MSG41 | Inline error banner | `fe-admin/src/features/auth/Login.js` – General error | `Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.` |
| 42 | MSG42 | Alert dialog | `FE-User/src/features/expert/screens/ExpertChatScreen.tsx` | `Không tìm thấy thông tin người dùng.` |
| 43 | MSG43 | Alert dialog | `FE-User/src/features/chat/screens/AIChatListScreen.tsx` | `Không tìm thấy thông tin người dùng.` |

---

**Note:** Message codes follow the format MSG## purely for documentation. Every string above exists verbatim in the repository at the referenced location.
