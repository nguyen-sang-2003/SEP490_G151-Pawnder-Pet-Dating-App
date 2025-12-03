# Tài liệu API - FE-Admin

## Tổng quan

Tài liệu này liệt kê tất cả các API endpoints được sử dụng trong ứng dụng FE-Admin, bao gồm:
- Endpoint URL
- HTTP Method
- Request Body/Params
- Response Format
- Nơi sử dụng trong code

---

## 1. Authentication APIs

### 1.1. Login
- **Service**: `authService.login()`
- **Endpoint**: `POST /api/login`
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string",
    "Platform": "admin"
  }
  ```
- **Response**: `{ accessToken, refreshToken, user }`
- **Sử dụng**: `features/auth/Login.js`

### 1.2. Logout
- **Service**: `authService.logout()`
- **Endpoint**: `POST /api/logout`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ message: string }`
- **Sử dụng**: `shared/context/AuthContext.js`

### 1.3. Refresh Token
- **Service**: `authService.refreshToken()`
- **Endpoint**: `POST /api/refresh`
- **Body**: `{ refreshToken: string }`
- **Response**: `{ accessToken, refreshToken }`
- **Sử dụng**: Có thể dùng để refresh token khi hết hạn

### 1.4. Forgot Password
- **Service**: `authService.forgotPassword()`
- **Endpoint**: `POST /api/forgot-password`
- **Body**: `{ email: string }`
- **Response**: `{ message: string }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 1.5. Reset Password
- **Service**: `authService.resetPassword()`
- **Endpoint**: `POST /api/reset-password`
- **Body**: `{ token: string, password: string }`
- **Response**: `{ message: string }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

---

## 2. User Management APIs

### 2.1. Get Users (List)
- **Service**: `userService.getUsers()`
- **Endpoint**: `GET /user?search=&roleId=&statusId=&page=1&pageSize=20&includeDeleted=false`
- **Query Params**:
  - `search`: Tìm kiếm theo tên/email
  - `roleId`: Lọc theo role (1=Admin, 2=Expert, 3=User)
  - `statusId`: Lọc theo status (1=Banned, 2=Normal, 3=Premium)
  - `page`: Số trang
  - `pageSize`: Số items mỗi trang
  - `includeDeleted`: Bao gồm user đã xóa
- **Response**: 
  ```json
  {
    "Items": UserResponse[],
    "Total": number,
    "Page": number,
    "PageSize": number
  }
  ```
- **Sử dụng**: 
  - `features/users/UsersList.js`
  - `features/experts/ExpertList.js`
  - `features/experts/CreateExpert.js`
  - `features/pets/PetsList.js`
  - `features/pets/PetDetail.js`
  - `features/pets/Activities.js`
  - `features/dashboard/Dashboard.js` (via dashboardService)

### 2.2. Get User By ID
- **Service**: `userService.getUserById()`
- **Endpoint**: `GET /user/{userId}`
- **Response**: `UserResponse`
- **Sử dụng**: 
  - `features/users/UserDetail.js`
  - `features/experts/ExpertDetail.js`
  - `features/experts/ExpertNotifications.js`
  - `features/reports/ReportDetail.js`
  - `features/reports/ReportsList.js`

### 2.3. Create User
- **Service**: `userService.createUser()`
- **Endpoint**: `POST /user`
- **Body**: User data
- **Response**: `UserResponse`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 2.4. Update User
- **Service**: `userService.updateUser()`
- **Endpoint**: `PUT /user/{userId}`
- **Body**: User data
- **Response**: `UserResponse`
- **Sử dụng**: `features/experts/ExpertDetail.js`

### 2.5. Delete User
- **Service**: `userService.deleteUser()`
- **Endpoint**: `DELETE /user/{userId}`
- **Response**: `{ message: string }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 2.6. Update User By Admin
- **Service**: `userService.updateUserByAdmin()`
- **Endpoint**: `PUT /admin/users/{id}`
- **Body**: 
  ```json
  {
    "isDelete": boolean,
    "userStatusId": number
  }
  ```
- **Response**: `UserResponse`
- **Sử dụng**: 
  - `features/users/UsersList.js` (ban/unban user)

### 2.7. Create User By Admin
- **Service**: `userService.createUserByAdmin()`
- **Endpoint**: `POST /admin/users`
- **Body**: User data
- **Response**: `UserResponse`
- **Sử dụng**: `features/experts/CreateExpert.js`

### 2.8. Reset Password By Email
- **Service**: `userService.resetPasswordByEmail()`
- **Endpoint**: `PUT /user/reset-password`
- **Body**: 
  ```json
  {
    "email": "string",
    "newPassword": "string"
  }
  ```
- **Response**: `{ message: string }`
- **Sử dụng**: `features/experts/ExpertDetail.js`

---

## 3. Pet Management APIs

### 3.1. Get Pets By User
- **Service**: `petService.getPetsByUser()`
- **Endpoint**: `GET /api/pet/user/{userId}`
- **Response**: `PetDto[]` hoặc `404` nếu user không có pet
- **Lưu ý**: Service tự động xử lý 404 và trả về `[]`
- **Sử dụng**: 
  - `features/users/UserDetail.js`
  - `features/pets/PetsList.js`
  - `features/pets/PetDetail.js`
  - `features/users/UsersList.js`
  - `features/dashboard/Dashboard.js` (via dashboardService)

### 3.2. Get Pet By ID
- **Service**: `petService.getPetById()`
- **Endpoint**: `GET /api/pet/{petId}`
- **Response**: `PetDto_1`
- **Sử dụng**: 
  - `features/pets/PetDetail.js`

### 3.3. Create Pet
- **Service**: `petService.createPet()`
- **Endpoint**: `POST /api/pet`
- **Body**: 
  ```json
  {
    "UserId": number,
    "Name": "string",
    "Breed": "string",
    "Gender": "string",
    "Age": number,
    "IsActive": boolean,
    "Description": "string"
  }
  ```
- **Response**: `PetDto`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 3.4. Update Pet
- **Service**: `petService.updatePet()`
- **Endpoint**: `PUT /api/pet/{petId}`
- **Body**: Pet data (tương tự Create)
- **Response**: `PetDto`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 3.5. Delete Pet
- **Service**: `petService.deletePet()`
- **Endpoint**: `DELETE /api/pet/{petId}`
- **Response**: `{ Message: string }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

---

## 4. Pet Photo APIs

### 4.1. Get Photos By Pet
- **Service**: `petPhotoService.getPhotosByPet()`
- **Endpoint**: `GET /api/petphoto/{petId}`
- **Response**: `PetPhotoResponse[]`
- **Sử dụng**: 
  - `features/pets/PetsList.js`
  - `features/pets/PetDetail.js`

### 4.2. Upload Photos
- **Service**: `petPhotoService.uploadPhotos()`
- **Endpoint**: `POST /api/petphoto`
- **Body**: `FormData` với `petId` và `files[]`
- **Response**: `{ message: string, photos: PetPhotoResponse[] }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 4.3. Set Primary Photo
- **Service**: `petPhotoService.setPrimaryPhoto()`
- **Endpoint**: `PUT /api/petphoto/{photoId}/primary`
- **Response**: `{ message: string }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 4.4. Reorder Photos
- **Service**: `petPhotoService.reorderPhotos()`
- **Endpoint**: `PUT /api/petphoto/reorder`
- **Body**: `[{ PhotoId: number, SortOrder: number }]`
- **Response**: `{ message: string }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 4.5. Delete Photo
- **Service**: `petPhotoService.deletePhoto()`
- **Endpoint**: `DELETE /api/petphoto/{photoId}?hard=false`
- **Query Params**: `hard` (boolean) - nếu true, xóa cả trên Cloudinary
- **Response**: `{ message: string }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

---

## 5. Report Management APIs

### 5.1. Get Reports
- **Service**: `reportService.getReports()`
- **Endpoint**: `GET /api/report`
- **Query Params**: Có thể có filters
- **Response**: 
  ```json
  {
    "success": boolean,
    "message": string,
    "data": ReportDto[]
  }
  ```
- **Sử dụng**: 
  - `features/reports/ReportsList.js`
  - `features/pets/Activities.js`
  - `features/dashboard/Dashboard.js` (via dashboardService)

### 5.2. Get Report By ID
- **Service**: `reportService.getReportById()`
- **Endpoint**: `GET /api/report/{reportId}`
- **Response**: 
  ```json
  {
    "success": boolean,
    "message": string,
    "data": ReportDto
  }
  ```
- **Sử dụng**: `features/reports/ReportDetail.js`

### 5.3. Create Report
- **Service**: `reportService.createReport()`
- **Endpoint**: `POST /api/report/{userReportId}/{contentId}`
- **Body**: 
  ```json
  {
    "Reason": "string"
  }
  ```
- **Response**: `{ success, message, data: ReportDto }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 5.4. Update Report
- **Service**: `reportService.updateReport()`
- **Endpoint**: `PUT /api/report/{reportId}`
- **Body**: 
  ```json
  {
    "Status": "string",
    "Resolution": "string"
  }
  ```
- **Response**: `{ success, message, data: ReportDto }`
- **Sử dụng**: `features/reports/ReportDetail.js` (resolve/reject report)

### 5.5. Resolve Report
- **Service**: `reportService.resolveReport()`
- **Endpoint**: `PUT /api/report/{reportId}`
- **Body**: 
  ```json
  {
    "Status": "Resolved",
    "Resolution": "string"
  }
  ```
- **Response**: `{ success, message, data: ReportDto }`
- **Sử dụng**: `features/reports/ReportDetail.js`

### 5.6. Reject Report
- **Service**: `reportService.rejectReport()`
- **Endpoint**: `PUT /api/report/{reportId}`
- **Body**: 
  ```json
  {
    "Status": "Rejected",
    "Resolution": "string"
  }
  ```
- **Response**: `{ success, message, data: ReportDto }`
- **Sử dụng**: `features/reports/ReportDetail.js`

---

## 6. Expert Management APIs

### 6.1. Get Expert Confirmations
- **Service**: `expertService.getExpertConfirmations()`
- **Endpoint**: `GET /expert-confirmation`
- **Query Params**: Có thể có filters
- **Response**: `ExpertConfirmation[]`
- **Sử dụng**: `features/experts/ExpertNotifications.js`

### 6.2. Get Expert Confirmation
- **Service**: `expertService.getExpertConfirmation()`
- **Endpoint**: `GET /expert-confirmation/{userId}/{chatId}`
- **Lưu ý**: Backend endpoint có vấn đề, service sử dụng workaround
- **Response**: `ExpertConfirmation`
- **Sử dụng**: Chưa được sử dụng trực tiếp

### 6.3. Get Expert Confirmations By User
- **Service**: `expertService.getExpertConfirmationsByUser()`
- **Endpoint**: `GET /expert-confirmation/{userId}`
- **Response**: `ExpertConfirmation[]`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 6.4. Create Expert Confirmation
- **Service**: `expertService.createExpertConfirmation()`
- **Endpoint**: `POST /expert-confirmation/{userId}/{chatId}`
- **Body**: 
  ```json
  {
    "ExpertId": number,
    "Message": "string"
  }
  ```
- **Response**: `ExpertConfirmation`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 6.5. Update Expert Confirmation
- **Service**: `expertService.updateExpertConfirmation()`
- **Endpoint**: `PUT /expert-confirmation/{expertId}/{userId}/{chatId}`
- **Body**: Confirmation data
- **Response**: `ExpertConfirmation`
- **Sử dụng**: `features/experts/ExpertNotifications.js` (approve/reject confirmation)

### 6.6. Get Chat History
- **Service**: `expertService.getChatHistory()`
- **Endpoint**: `GET /api/chat-ai/{chatAiId}/messages`
- **Response**: Chat messages array
- **Sử dụng**: `features/experts/ExpertNotifications.js`

---

## 7. Expert Chat APIs

### 7.1. Get Chats By Expert ID
- **Service**: `chatExpertService.getChatsByExpertId()`
- **Endpoint**: `GET /api/ChatExpert/expert/{expertId}`
- **Response**: Chat list
- **Sử dụng**: `features/experts/ExpertChat.js`

### 7.2. Get Chats By User ID
- **Service**: `chatExpertService.getChatsByUserId()`
- **Endpoint**: `GET /api/ChatExpert/user/{userId}`
- **Response**: Chat list
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 7.3. Create Chat
- **Service**: `chatExpertService.createChat()`
- **Endpoint**: `POST /api/ChatExpert/{expertId}/{userId}`
- **Response**: Chat object
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 7.4. Get Messages
- **Service**: `chatExpertService.getMessages()`
- **Endpoint**: `GET /api/ChatExpertContent/{chatExpertId}`
- **Response**: Message array
- **Sử dụng**: `features/experts/ExpertChat.js`

### 7.5. Send Message
- **Service**: `chatExpertService.sendMessage()`
- **Endpoint**: `POST /api/ChatExpertContent/{chatExpertId}/{fromId}`
- **Body**: 
  ```json
  {
    "Message": "string",
    "ExpertId": number,
    "UserId": number,
    "ChatAiid": number
  }
  ```
- **Response**: Message object
- **Sử dụng**: `features/experts/ExpertChat.js`

---

## 8. Dashboard APIs

### 8.1. Get Dashboard Stats
- **Service**: `dashboardService.getDashboardStats()`
- **Endpoint**: Tổng hợp từ nhiều endpoints
- **Response**: 
  ```json
  {
    "totalUsers": number,
    "totalPets": number,
    "pendingReports": number,
    "resolvedReports": number,
    "activeUsersToday": number,
    "recentActivities": Activity[],
    "userGrowthData": ChartData[]
  }
  ```
- **Sử dụng**: `features/dashboard/Dashboard.js`

**Các helper methods trong dashboardService:**
- `getUsersTotal()` - GET /user?pageSize=1
- `getAllUsers(limit)` - GET /user với pagination
- `getReportsData()` - GET /api/report
- `getTotalPets(totalUsers)` - Tính từ nhiều GET /api/pet/user/{userId}
- `getActiveUsersToday()` - Tính từ user data
- `getRecentActivities()` - Tổng hợp từ users và reports
- `getUserGrowthData(totalUsers)` - Tính từ user creation dates

---

## 9. Payment Management APIs

### 9.1. Get All Payment Histories
- **Service**: `paymentService.getAllHistories()`
- **Endpoint**: `GET /api/payment-history/all`
- **Response**: 
  ```json
  {
    "success": boolean,
    "data": PaymentHistory[]
  }
  ```
- **Sử dụng**: `features/payments/PaymentManagement.js`

---

## 10. Attribute Management APIs

### 10.1. Get Attributes
- **Service**: `attributeService.getAttributes()`
- **Endpoint**: `GET /api/attribute?page=1&pageSize=50&includeDeleted=false`
- **Query Params**: 
  - `page`: Số trang
  - `pageSize`: Số items mỗi trang
  - `includeDeleted`: Bao gồm attributes đã xóa
- **Response**: 
  ```json
  {
    "items": Attribute[],
    "pagination": {
      "page": number,
      "pageSize": number,
      "total": number
    }
  }
  ```
- **Sử dụng**: `features/attributes/AttributeManagement.js`

### 10.2. Create Attribute
- **Service**: `attributeService.createAttribute()`
- **Endpoint**: `POST /api/attribute`
- **Body**: Attribute data
- **Response**: `Attribute`
- **Sử dụng**: `features/attributes/AttributeManagement.js`

### 10.3. Update Attribute
- **Service**: `attributeService.updateAttribute()`
- **Endpoint**: `PUT /api/attribute/{attributeId}`
- **Body**: Attribute data
- **Response**: `Attribute`
- **Sử dụng**: `features/attributes/AttributeManagement.js`

### 10.4. Delete Attribute
- **Service**: `attributeService.deleteAttribute()`
- **Endpoint**: `DELETE /api/attribute/{attributeId}?hard=true`
- **Query Params**: `hard` (boolean) - nếu true, xóa vĩnh viễn
- **Response**: `{ message: string }`
- **Sử dụng**: `features/attributes/AttributeManagement.js`

### 10.5. Get Attribute Options
- **Service**: `attributeService.getAttributeOptions()`
- **Endpoint**: `GET /api/attributeoption/{attributeId}`
- **Response**: `AttributeOption[]`
- **Sử dụng**: `features/attributes/AttributeManagement.js`

### 10.6. Create Option
- **Service**: `attributeService.createOption()`
- **Endpoint**: `POST /api/attributeoption/attribute-option/{attributeId}`
- **Body**: Option name (string)
- **Response**: `AttributeOption`
- **Sử dụng**: `features/attributes/AttributeManagement.js`

### 10.7. Update Option
- **Service**: `attributeService.updateOption()`
- **Endpoint**: `PUT /api/attributeoption/attribute-option/{optionId}`
- **Body**: Option name (string)
- **Response**: `AttributeOption`
- **Sử dụng**: `features/attributes/AttributeManagement.js`

### 10.8. Delete Option
- **Service**: `attributeService.deleteOption()`
- **Endpoint**: `DELETE /api/attributeoption/attribute-option/{optionId}`
- **Response**: `{ message: string }`
- **Sử dụng**: `features/attributes/AttributeManagement.js`

---

## 11. Notification APIs

### 11.1. Get Notifications
- **Service**: `notificationService.getNotifications()`
- **Endpoint**: `GET /api/notification`
- **Query Params**: Có thể có filters
- **Response**: `NotificationDto[]`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 11.2. Get Notification By ID
- **Service**: `notificationService.getNotificationById()`
- **Endpoint**: `GET /api/notification/{notificationId}`
- **Response**: `NotificationDto`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 11.3. Get Notifications By User
- **Service**: `notificationService.getNotificationsByUser()`
- **Endpoint**: `GET /api/notification/user/{userId}`
- **Response**: `Notification[]`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 11.4. Create Notification
- **Service**: `notificationService.createNotification()`
- **Endpoint**: `POST /api/notification`
- **Body**: 
  ```json
  {
    "UserId": number,
    "Title": "string",
    "Message": "string"
  }
  ```
- **Response**: `Notification`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

### 11.5. Delete Notification
- **Service**: `notificationService.deleteNotification()`
- **Endpoint**: `DELETE /api/notification/{notificationId}`
- **Response**: `{ Message: string }`
- **Sử dụng**: Chưa được sử dụng trong FE-Admin

---

## Tổng kết sử dụng API theo Feature

### Auth Feature
- ✅ `authService.login()` - Đăng nhập

### Dashboard Feature
- ✅ `dashboardService.getDashboardStats()` - Lấy thống kê tổng quan

### Users Feature
- ✅ `userService.getUsers()` - Danh sách users
- ✅ `userService.getUserById()` - Chi tiết user
- ✅ `userService.updateUserByAdmin()` - Cập nhật user (ban/unban)
- ✅ `petService.getPetsByUser()` - Lấy pets của user

### Pets Feature
- ✅ `userService.getUsers()` - Lấy danh sách users
- ✅ `petService.getPetsByUser()` - Lấy pets theo user
- ✅ `petPhotoService.getPhotosByPet()` - Lấy ảnh của pet
- ✅ `petService.getPetById()` - Chi tiết pet
- ✅ `reportService.getReports()` - Lấy reports cho activities

### Reports Feature
- ✅ `reportService.getReports()` - Danh sách reports
- ✅ `reportService.getReportById()` - Chi tiết report
- ✅ `reportService.updateReport()` - Cập nhật report (resolve/reject)
- ✅ `userService.getUserById()` - Lấy thông tin reporter

### Experts Feature
- ✅ `userService.getUsers()` - Danh sách experts
- ✅ `userService.getUserById()` - Chi tiết expert
- ✅ `userService.createUserByAdmin()` - Tạo expert mới
- ✅ `userService.updateUser()` - Cập nhật expert
- ✅ `userService.resetPasswordByEmail()` - Reset password
- ✅ `expertService.getExpertConfirmations()` - Danh sách confirmations
- ✅ `expertService.updateExpertConfirmation()` - Cập nhật confirmation
- ✅ `expertService.getChatHistory()` - Lịch sử chat AI
- ✅ `chatExpertService.getChatsByExpertId()` - Danh sách chats
- ✅ `chatExpertService.getMessages()` - Lấy messages
- ✅ `chatExpertService.sendMessage()` - Gửi message

### Payments Feature
- ✅ `paymentService.getAllHistories()` - Lấy lịch sử thanh toán

### Attributes Feature
- ✅ `attributeService.getAttributes()` - Danh sách attributes
- ✅ `attributeService.getAttributeOptions()` - Lấy options của attribute
- ✅ `attributeService.createAttribute()` - Tạo attribute mới
- ✅ `attributeService.updateAttribute()` - Cập nhật attribute
- ✅ `attributeService.deleteAttribute()` - Xóa attribute
- ✅ `attributeService.createOption()` - Tạo option mới
- ✅ `attributeService.updateOption()` - Cập nhật option
- ✅ `attributeService.deleteOption()` - Xóa option

---

## API Client Configuration

### Base URL
- **Development**: `http://localhost:5297`
- **Production**: Cấu hình trong `shared/constants/index.js`

### Authentication
- Tất cả requests (trừ login) đều cần JWT token
- Token được tự động thêm vào header: `Authorization: Bearer {token}`
- Token được lưu trong `localStorage` với key `STORAGE_KEYS.ACCESS_TOKEN`

### Error Handling
- **401 Unauthorized**: Tự động redirect về `/login`
- **404 Not Found**: Được xử lý gracefully (ví dụ: user không có pets)
- **500 Server Error**: Hiển thị error message từ backend
- **Network Error**: Hiển thị "Không thể kết nối đến máy chủ"

### Response Format
- Hầu hết APIs trả về data trực tiếp (đã được apiClient unwrap)
- Một số APIs trả về format: `{ success, message, data }`
- Pagination format: `{ Items, Total, Page, PageSize }`

---

## Lưu ý quan trọng

1. **API Endpoints**: Tất cả endpoints được định nghĩa trong `shared/constants/index.js`
2. **Service Pattern**: Mỗi service là một class/object với các methods tương ứng
3. **Error Handling**: apiClient tự động xử lý errors và unwrap responses
4. **Token Management**: Token được quản lý tự động qua interceptors
5. **Mock Data**: Một số features có fallback sang mock data khi API fail

