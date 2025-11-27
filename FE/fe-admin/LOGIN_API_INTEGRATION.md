# Login API Integration - Hướng dẫn

## ✅ Đã cập nhật

### 1. AuthContext.js
- ✅ Đã chuyển từ mock data sang gọi API thật từ backend
- ✅ Gọi `authService.login()` để đăng nhập
- ✅ Decode JWT token để lấy userId và role
- ✅ Gọi `userService.getUserById()` để lấy thông tin user đầy đủ
- ✅ Map UserResponse từ backend sang format frontend
- ✅ Xử lý error từ backend (401, network error, etc.)

### 2. jwtUtils.js
- ✅ Cập nhật để đọc đúng claims từ backend:
  - `ClaimTypes.NameIdentifier` → `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`
  - `ClaimTypes.Role` → `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`

### 3. Error Handling
- ✅ Xử lý các loại error:
  - Backend error (401, 500, etc.) với message
  - Network error (không kết nối được server)
  - Other errors (từ code)

## 🔧 Flow Login

1. User nhập email và password
2. Frontend gọi `authService.login(credentials)`
3. Backend xác thực và trả về `{ Message: string, Token: string }`
4. Frontend lưu token vào localStorage
5. Frontend decode JWT token để lấy userId và role
6. Frontend gọi `userService.getUserById(userId)` để lấy thông tin user
7. Frontend map UserResponse sang format frontend cần
8. Frontend lưu user info vào localStorage và dispatch LOGIN_SUCCESS
9. Frontend redirect dựa trên role (Admin → /dashboard, Expert → /expert/notifications)

## 📋 Backend Response Format

### Login Success (200 OK)
```json
{
  "Message": "Đăng nhập thành công",
  "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login Error (401 Unauthorized)
```
"Tài khoản không tồn tại"
```
hoặc
```
"Sai mật khẩu"
```

### UserResponse (GET /user/{userId})
```json
{
  "UserId": 1,
  "RoleId": 1,
  "UserStatusId": 1,
  "AddressId": null,
  "FullName": "Admin User",
  "Gender": "Male",
  "Email": "admin@pawnder.com",
  "ProviderLogin": null,
  "IsDeleted": false,
  "CreatedAt": "2024-01-01T00:00:00",
  "UpdatedAt": "2024-01-01T00:00:00"
}
```

## 🔑 JWT Token Claims

Backend sử dụng:
- `ClaimTypes.NameIdentifier` → userId (số)
- `ClaimTypes.Role` → role name ("Admin", "Expert", "User")

## 🧪 Test Login

### 1. Start Backend
```bash
cd BE/BE
dotnet run
```
Backend sẽ chạy ở `http://localhost:5297`

### 2. Start Frontend
```bash
cd FE/fe-admin
npm start
```
Frontend sẽ chạy ở `http://localhost:3000`

### 3. Test với các tài khoản

#### Admin
- Email: `admin@pawnder.com`
- Password: `123456` (hoặc password đã hash trong database)

#### Expert
- Email: `expert@pawnder.com`
- Password: `123456` (hoặc password đã hash trong database)

## 🐛 Debug

### Nếu login thất bại:

1. **Kiểm tra Backend có chạy không:**
   - Mở browser console
   - Kiểm tra Network tab
   - Xem request đến `/api/login` có thành công không

2. **Kiểm tra CORS:**
   - Nếu có lỗi CORS, kiểm tra `Program.cs` có cấu hình CORS đúng không
   - Đảm bảo `app.UseCors()` được gọi đầu tiên

3. **Kiểm tra JWT Token:**
   - Mở browser console
   - Chạy: `localStorage.getItem('access_token')`
   - Decode JWT token tại: https://jwt.io
   - Kiểm tra claims có đúng không

4. **Kiểm tra Error Message:**
   - Mở browser console
   - Xem error message từ backend
   - Kiểm tra `error.response.data` để xem backend trả về gì

## ✅ Checklist

- [x] AuthContext gọi API thật từ backend
- [x] JWT token được decode đúng
- [x] User info được lấy từ backend
- [x] Error handling đầy đủ
- [x] Token được lưu vào localStorage
- [x] User info được lưu vào localStorage
- [x] Redirect dựa trên role

## 📝 Lưu ý

1. **Password Hash:** Backend sử dụng SHA256 để hash password. Đảm bảo password trong database đã được hash đúng.

2. **JWT Token Expiry:** Token có thời hạn 2 giờ (từ backend). Nếu token hết hạn, user cần đăng nhập lại.

3. **Role Mapping:** Frontend map role từ backend:
   - "Admin" → USER_ROLES.ADMIN
   - "Expert" → USER_ROLES.EXPERT
   - "User" → USER_ROLES.USER

4. **UserResponse Mapping:** Frontend map UserResponse từ backend sang format:
   - `UserId` → `id`
   - `FullName` → split thành `firstName` và `lastName`
   - `Email` → `email`
   - Role từ JWT token → `role`

---

**Ngày cập nhật:** 2024-01-XX  
**Phiên bản:** 1.0.0

